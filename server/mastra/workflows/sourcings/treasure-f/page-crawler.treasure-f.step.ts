import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'
import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import type { ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS, type StockStatus } from '@/common/domains/types/stock-status'
import { buildQueryTreasureFStep } from './build-query.treasure-f.step'
import { promptProductSaver } from '@/server/server-lib/prompt-lock'

const productSchema = z.object({
  uniqueKey: z.string(),
  title: z.object({
    en: z.string(),
    ja: z.string(),
  }),
  price: z.number(),
  priceWithTax: z.number().optional(),
  currency: z.string(),
  condition: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  url: z.string().optional(),
  status: z.custom<StockStatus>(),
  itemCode: z.string(),
  shopName: z.string(),
  shopIconUrl: z.string(),
}) satisfies z.ZodType<ProductEntity>

const pageCrawlerTreasureFStep = new Step({
  id: 'pageCrawlerTreasureFStep',
  inputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  outputSchema: z.object({
    products: z.array(productSchema),
  }),
  execute: async ({ context }) => {
    const keyword = context.getStepResult(buildQueryTreasureFStep)?.keyword
    const options = context.getStepResult(buildQueryTreasureFStep)?.options
    const promptUniqueKey = context.triggerData?.promptUniqueKey as string

    if (!keyword || !options) {
      throw new Error('Failed to get keyword or options')
    }

    if (!promptUniqueKey) {
      throw new Error('Failed to get promptUniqueKey')
    }

    try {
      // 検索URLの構築
      const baseUrl = 'https://ec.treasure-f.com/search'
      const searchParams = new URLSearchParams()
      searchParams.append('word', keyword)
      // オプションを追加
      Object.entries(options).forEach(([key, value]) => {
        searchParams.append(key, value)
      })
      // 必須パラメータがなければ追加
      if (!searchParams.has('step')) {
        searchParams.append('step', '1')
      }
      if (!searchParams.has('order')) {
        searchParams.append('order', 'relevance')
      }
      if (!searchParams.has('size')) {
        searchParams.append('size', 'grid')
      }
      if (!searchParams.has('number')) {
        searchParams.append('number', '60')
      }

      const initialUrl = `${baseUrl}?${searchParams.toString()}`
      console.log('Initial URL:', initialUrl)

      // 一時ディレクトリを作成
      const tmpDir = path.join(process.cwd(), 'tmp', 'treasure-f-pages')
      console.log('Temporary directory path:', tmpDir)

      if (!fs.existsSync(tmpDir)) {
        console.log('Creating directory:', tmpDir)
        fs.mkdirSync(tmpDir, { recursive: true })
      }

      // 最初のページを取得して総ページ数を解析
      console.log('Fetching initial page to determine total pages')

      let initialResponse
      try {
        initialResponse = await fetch(initialUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"macOS"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
          },
          redirect: 'follow',
        })
      } catch (error) {
        console.error(`Failed to fetch initial page: ${error}`)
        // 初期ページの取得に失敗した場合は空の結果を返す
        return {
          products: [],
        }
      }

      if (!initialResponse.ok) {
        console.error(`HTTP error for initial page! status: ${initialResponse.status}`)
        // 404などのエラーの場合は空の結果を返す
        return {
          products: [],
        }
      }

      // リダイレクト後のURLを取得
      const finalUrl = initialResponse.url
      console.log('Final URL after redirect:', finalUrl)

      // レスポンスをテキストとして取得
      const initialHtml = await initialResponse.text()
      const $ = cheerio.load(initialHtml)

      // デバッグ用にHTMLを保存
      try {
        const debugDir = path.join(process.cwd(), 'debug')
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true })
        }
        fs.writeFileSync(path.join(debugDir, 'treasure-f-initial-page.html'), initialHtml)
        console.log('Saved debug HTML to treasure-f-initial-page.html')
      } catch (error) {
        console.error('Failed to save debug HTML:', error)
      }

      // 検索結果の総数を取得
      const totalItemsText =
        $('p[ref^="s1e"]')
          .text()
          .match(/検索結果\（(\d+)件\）/)?.[1] ||
        $('li.is-current.cm-typo_body_d')
          .text()
          .match(/検索結果（(\d+)件）/)?.[1] ||
        '0'
      const totalItems = parseInt(totalItemsText)
      console.log('Total search results:', totalItems)

      // 合計ページ数を取得
      let maxPage = 1
      const paginationItems = $('ul[ref^="s1e"] li[ref^="s1e"], .page-pagination li').filter(
        (_, el) => {
          const text = $(el).text().trim()
          return /^\d+$/.test(text)
        },
      )

      if (paginationItems.length > 0) {
        const lastPageText = paginationItems.last().text().trim()
        maxPage = lastPageText ? parseInt(lastPageText) : 1
      } else {
        // ページネーションが見つからない場合、アイテム数から推定
        maxPage = Math.ceil(totalItems / parseInt(searchParams.get('number') || '60'))
      }
      console.log(`Total pages detected: ${maxPage}`)

      // 実際に取得するページ数（テスト用に制限をかける場合）
      const pagesToFetch = Math.min(maxPage, 3) // 最大3ページまでに制限
      console.log(`Pages to fetch: ${pagesToFetch}`)

      // 全ページのURLを生成
      const urls = Array.from({ length: pagesToFetch }, (_, i) => {
        const pageParams = new URLSearchParams(searchParams)
        if (i > 0) {
          // 1ページ目はデフォルトでpage指定不要
          pageParams.set('page', (i + 1).toString())
        }
        return `${baseUrl}?${pageParams.toString()}`
      })

      const allProducts: ProductEntity[] = []

      // URLからHTMLを取得して処理
      await Promise.all(
        urls.map(async (url: string, index: number) => {
          try {
            console.log(`Fetching URL: ${url}`)
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 8000)

            let response
            try {
              response = await fetch(url, {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                  Accept:
                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                  'Cache-Control': 'no-cache',
                  Pragma: 'no-cache',
                  'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                  'Sec-Ch-Ua-Mobile': '?0',
                  'Sec-Ch-Ua-Platform': '"macOS"',
                  'Sec-Fetch-Dest': 'document',
                  'Sec-Fetch-Mode': 'navigate',
                  'Sec-Fetch-Site': 'none',
                  'Sec-Fetch-User': '?1',
                  'Upgrade-Insecure-Requests': '1',
                  Referer: initialUrl,
                },
                signal: controller.signal,
                redirect: 'follow',
              })
              clearTimeout(timeout)
            } catch (error) {
              clearTimeout(timeout)
              console.error(`Failed to fetch ${url}: ${error}`)
              return []
            }

            if (!response.ok) {
              console.error(`HTTP error! status: ${response.status} for URL: ${url}`)
              return []
            }

            // リダイレクト後のURLを取得
            const finalUrl = response.url
            console.log(`Final URL after redirect: ${finalUrl}`)

            // レスポンスをチャンクで読み込む
            const chunks = []
            const reader = response.body?.getReader()
            if (!reader) throw new Error('Failed to get response reader')

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              chunks.push(value)
            }

            const allChunks = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
            let position = 0
            for (const chunk of chunks) {
              allChunks.set(chunk, position)
              position += chunk.length
            }

            const html = new TextDecoder().decode(allChunks)
            console.log(`Received HTML content length: ${html.length}`)

            // HTMLを保存
            const fileName = `page_${index + 1}.html`
            const filePath = path.join(tmpDir, fileName)
            console.log(`Saving HTML to: ${filePath}`)
            fs.writeFileSync(filePath, html, 'utf-8')

            // デバッグ用にHTMLを保存
            try {
              const debugDir = path.join(process.cwd(), 'debug')
              if (!fs.existsSync(debugDir)) {
                fs.mkdirSync(debugDir, { recursive: true })
              }
              fs.writeFileSync(path.join(debugDir, `treasure-f-page-${index + 1}.html`), html)
              console.log(`Saved debug HTML to treasure-f-page-${index + 1}.html`)
            } catch (error) {
              console.error('Failed to save debug HTML:', error)
            }

            // HTMLからProductEntityに変換
            const pageProducts = mapHtmlToProducts(html)
            console.log(`Extracted ${pageProducts.length} products from page ${index + 1}`)

            // プロンプトに直接結果を追加（ロックを使用）
            let lockAcquired = false
            try {
              lockAcquired = promptProductSaver.acquireLock(promptUniqueKey)
              if (lockAcquired) {
                const isPartial = index < urls.length - 1
                await promptProductSaver.saveProducts(
                  promptUniqueKey,
                  pageProducts,
                  'treasure-f',
                  isPartial,
                )
              } else {
                console.log(`ロックが取得できなかったため待機中... (treasure-f, Page ${index + 1})`)
                // ロック取得を試みるシンプルな再試行ロジック
                let retries = 0
                while (!lockAcquired && retries < 5) {
                  await new Promise((resolve) => setTimeout(resolve, 500))
                  lockAcquired = promptProductSaver.acquireLock(promptUniqueKey)
                  retries++
                }

                if (lockAcquired) {
                  const isPartial = index < urls.length - 1
                  await promptProductSaver.saveProducts(
                    promptUniqueKey,
                    pageProducts,
                    'treasure-f',
                    isPartial,
                  )
                } else {
                  console.error(
                    `ロックが取得できませんでした。データは保存されません (treasure-f, Page ${index + 1})`,
                  )
                }
              }
            } finally {
              if (lockAcquired) {
                promptProductSaver.releaseLock(promptUniqueKey)
              }
            }

            // 結果を返すためのリストにも追加
            allProducts.push(...pageProducts)

            return pageProducts
          } catch (error) {
            console.error(`Failed to fetch ${url}:`, error)
            return []
          }
        }),
      )

      console.log(`Total products extracted: ${allProducts.length}`)

      // すべてのページの処理が終わったら、最終的な結果として保存
      let finalLockAcquired = false
      try {
        finalLockAcquired = promptProductSaver.acquireLock(promptUniqueKey)
        if (finalLockAcquired) {
          // 最終的な結果を保存して完了としてマーク
          await promptProductSaver.markComplete(promptUniqueKey)
        } else {
          console.error('最終結果の保存ためにロックが取得できませんでした')
        }
      } finally {
        if (finalLockAcquired) {
          promptProductSaver.releaseLock(promptUniqueKey)
        }
      }

      return {
        products: allProducts,
      }
    } catch (e) {
      console.error('Error in page crawler:', e)
      // エラーをスローする代わりに空の結果を返す
      return {
        products: [],
      }
    }
  },
})

export { pageCrawlerTreasureFStep }

// HTMLをProductEntityに変換する関数
const mapHtmlToProducts = (html: string): ProductEntity[] => {
  const $ = cheerio.load(html)
  const products: ProductEntity[] = []

  // スナップショット形式とノーマルフォーマットの両方をサポート
  const $items: any[] = []
  const productSelectors = [
    'ul[ref="s1e191"] > li',
    'ul[ref^="s1e"] > li[ref^="s1e"]',
    '.items > .item', // 通常のHTML形式
    '.cm-itemlist.cm-itemlist_a > .pj-search_item', // トレファクONLINEの実際の商品リスト構造
    'ul.cm-itemlist > li.pj-search_item', // バリエーション
    '.pj-search_items .cm-itemlist li', // より広範囲なセレクタ
  ]

  for (const selector of productSelectors) {
    const items = $(selector)
    console.log(`セレクタ ${selector} で ${items.length} 個の商品要素が見つかりました`)
    if (items.length > 0) {
      items.each((_, element) => {
        $items.push($(element))
      })
      break
    }
  }

  console.log(`合計 ${$items.length} 個の商品要素が見つかりました`)

  // さらに詳細なデバッグ情報
  if ($items.length === 0) {
    console.log('商品リストが見つかりませんでした。代替手段を試みます:')

    // 最も単純なセレクタで試す
    const allItems = $('.pj-search_items li')
    console.log(`単純なセレクタ .pj-search_items li で ${allItems.length} 個の要素が見つかりました`)

    if (allItems.length > 0) {
      // 改めて商品リストを取得し直す
      allItems.each((_, element) => {
        $items.push($(element))
      })
    }
  }

  for (const $item of $items) {
    try {
      // 商品ページへのリンク
      // スナップショット形式と通常のHTMLフォーマットの両方をサポート
      const itemLink = $item
        .find('a[href*="/item/"], a[href*="/ec/detail/"], a.cm-itemlist_itemcode_link')
        .first()
      const itemHref = itemLink.attr('href')

      if (!itemHref) {
        console.log('商品リンクが見つかりませんでした')
        continue
      }

      // 商品ページのURL
      let url
      if (itemHref.startsWith('http')) {
        url = itemHref
      } else if (itemHref.startsWith('/item/')) {
        url = `https://ec.treasure-f.com${itemHref}`
      } else if (itemHref.includes('/ec/detail/')) {
        url = `https://ec.treasure-f.com${itemHref}`
      } else {
        url = `https://ec.treasure-f.com${itemHref}`
      }

      // 商品タイトル
      let title = ''
      // 商品タイトルの取得（複数の方法でトライ）
      const titleElements = [
        $item.find('.cm-itemlist_text').last(), // 最後のテキスト要素（通常商品名）
        $item.find('.cm-typo_body_a.cm-itemlist_text').last(), // クラス指定でより詳細に
        $item.find('p.cm-itemlist_text').last(), // pタグで指定
        $item
          .find('text')
          .filter(function (this: any) {
            return (
              $(this).text().trim().length > 0 &&
              !$(this).text().includes('￥') &&
              !$(this).text().includes('¥')
            )
          })
          .first(),
      ]

      // 最初に見つかった有効なタイトル要素を使用
      for (const elem of titleElements) {
        if (elem.length > 0 && elem.text().trim()) {
          title = elem.text().trim()
          break
        }
      }

      // 通常のHTML形式のバックアップ
      if (!title) {
        title = $item.find('.item_name, .name, .title').first().text().trim()
      }

      if (!title) {
        console.log('商品タイトルが見つかりませんでした')
        continue
      }

      // 価格
      // スナップショット形式と通常のHTML形式の両方の要素を試す
      const priceSelectors = [
        'p.cm-typo_head4.cm-itemlist_price', // 実際のサイトの価格表示要素
        '.cm-itemlist_price',
        'paragraph[ref^="s1e"]',
        '.item_price',
        '.price',
        '.selling_price',
      ]

      let priceText = ''
      for (const selector of priceSelectors) {
        const elem = $item.find(selector).filter(function (this: any) {
          const text = $(this).text()
          return text.includes('￥') || text.includes('¥')
        })

        if (elem.length > 0 && elem.text().trim()) {
          priceText = elem.text().trim()
          break
        }
      }

      if (!priceText) {
        console.log('商品価格が見つかりませんでした')
        continue
      }

      // 価格からテキストを抽出して数値化
      const priceMatch = priceText.match(/[¥￥]([0-9,]+)/)
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0

      if (!price) {
        console.log(`価格が正しく抽出できませんでした: ${priceText}`)
        continue
      }

      // 商品画像
      let imageUrl = ''
      // 画像要素を探す（複数の方法でトライ）
      const imageSelectors = [
        '.cm-itemlist_image img', // 実際のサイトの画像要素
        'image[ref^="s1e"]',
        'img.item_image',
        'img.image',
        'img.product_image',
        'img', // 最後の手段として任意のimg要素
      ]

      for (const selector of imageSelectors) {
        const elem = $item.find(selector).first()
        if (elem.length > 0) {
          imageUrl = elem.attr('src') || elem.attr('data-src') || ''
          if (imageUrl) break
        }
      }

      // 相対パスの場合はベースURLを追加
      if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = `https://ec.treasure-f.com${imageUrl}`
      }

      // 商品の状態
      // 様々な状態表示要素を試す
      const conditionSelectors = [
        '.cm-tag_unused',
        '.cm-tag_new',
        'text',
        '.item_condition',
        '.condition',
        '.status',
      ]

      let conditionText = ''
      for (const selector of conditionSelectors) {
        let elem
        if (selector === 'text') {
          elem = $item
            .find(selector)
            .filter(function (this: any) {
              const text = $(this).text().trim()
              return text === '未使用' || text.includes('SALE') || text.includes('NEW')
            })
            .first()
        } else {
          elem = $item.find(selector).first()
        }

        if (elem.length > 0 && elem.text().trim()) {
          conditionText = elem.text().trim()
          break
        }
      }

      // 未使用タグがない場合
      if (!conditionText) {
        conditionText = '状態不明'
      }

      // ショップ情報
      // ショップリンクを探す
      const shopSelectors = ['a[href*="/shop/"]', 'a[href*="/search?step=1&shop="]']

      let shopName = ''
      for (const selector of shopSelectors) {
        const elem = $item.find(selector)
        if (elem.length > 0 && elem.text().trim()) {
          shopName = elem.text().trim()
          break
        }
      }

      if (!shopName) {
        shopName = 'トレファクONLINE'
      }

      // 在庫状況
      const status = STOCK_STATUS.AVAILABLE

      const uniqueKey = uuidv4()
      let itemCode = ''

      // 商品コードの抽出方法
      // URLからパターンを抽出
      const itemCodeMatch = url.match(/\/item\/([^\/\?]+)/) || url.match(/\/ec\/detail\/([^\/\?]+)/)
      if (itemCodeMatch && itemCodeMatch[1]) {
        itemCode = itemCodeMatch[1]
      } else {
        // URLからのパターン抽出に失敗した場合、ランダムな文字列を生成
        itemCode = `tf-${Math.random().toString(36).substring(2, 10)}`
      }

      const product: ProductEntity = {
        uniqueKey,
        url,
        title: {
          ja: title,
          en: title,
        },
        description: title,
        price,
        currency: 'JPY',
        condition: conditionText,
        itemCode,
        imageUrl,
        shopName,
        status,
        shopIconUrl: 'https://ec.treasure-f.com/favicon.ico',
      }

      products.push(product)
    } catch (error) {
      console.error('商品の解析中にエラーが発生しました:', error)
    }
  }

  console.log(`Extracted ${products.length} products from HTML`)
  return products
}

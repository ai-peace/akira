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
          .match(/検索結果\（(\d+)件\）/)?.[1] || '0'
      const totalItems = parseInt(totalItemsText)
      console.log('Total search results:', totalItems)

      // 合計ページ数を取得
      const paginationItems = $('ul[ref^="s1e"] li[ref^="s1e"]').filter((_, el) => {
        const text = $(el).text().trim()
        return /^\d+$/.test(text)
      })

      const lastPageText = paginationItems.last().text().trim()
      const maxPage = lastPageText ? parseInt(lastPageText) : 1
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

  for (const $item of $items) {
    try {
      // 商品ページへのリンク
      // スナップショット形式と通常のHTMLフォーマットの両方をサポート
      const itemLink = $item.find('a[href*="/ec/detail/"]').first()
      const itemHref = itemLink.attr('href')

      if (!itemHref || !itemHref.includes('/ec/detail/')) {
        console.log('商品リンクが見つかりませんでした')
        continue
      }

      // 商品ページのURL
      const url = `https://ec.treasure-f.com${itemHref}`

      // 商品タイトル
      let title = ''
      // スナップショット形式
      const titleElement = $item
        .find('text')
        .filter(function (this: any) {
          return (
            $(this).text().trim().length > 0 &&
            !$(this).text().includes('￥') &&
            !$(this).text().includes('¥')
          )
        })
        .first()

      if (titleElement.length > 0) {
        title = titleElement.text().trim()
      } else {
        // 通常のHTML形式
        title = $item.find('.item_name, .name, .title').first().text().trim()
      }

      if (!title) {
        console.log('商品タイトルが見つかりませんでした')
        continue
      }

      // 価格
      // スナップショット形式: "￥"マークを含むparagraphタグ
      const priceElement = $item.find('paragraph[ref^="s1e"]').filter(function (this: any) {
        const text = $(this).text()
        return text.includes('￥') || text.includes('¥')
      })

      // 通常のHTML形式: 価格を含む要素
      const normalPriceElement = $item.find('.item_price, .price, .selling_price')

      let priceText = ''
      if (priceElement.length > 0) {
        priceText = priceElement.text().trim()
      } else if (normalPriceElement.length > 0) {
        priceText = normalPriceElement.text().trim()
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
      // スナップショット形式
      const imageElement = $item.find('image[ref^="s1e"]').first()
      if (imageElement.length > 0) {
        imageUrl = imageElement.attr('src') || ''
      } else {
        // 通常のHTML形式
        const normalImageElement = $item
          .find('img.item_image, img.image, img.product_image')
          .first()
        imageUrl = normalImageElement.attr('src') || normalImageElement.attr('data-src') || ''
      }

      // 商品の状態
      // スナップショット形式
      let conditionText = $item
        .find('text')
        .filter(function (this: any) {
          const text = $(this).text().trim()
          return text === '未使用' || text.includes('SALE') || text.includes('NEW')
        })
        .first()
        .text()
        .trim()

      // 通常のHTML形式
      if (!conditionText) {
        conditionText = $item.find('.item_condition, .condition, .status').first().text().trim()
      }

      // デフォルト値
      if (!conditionText) {
        conditionText = '状態不明'
      }

      // ショップ情報
      // スナップショット形式
      let shopName = ''
      const shopLink = $item.find('a[ref^="s1e"]').filter(function (this: any) {
        const href = $(this).attr('href')
        return href && (href.includes('/shop/') || href.includes('/search?step=1&shop='))
      })

      // 通常のHTML形式
      const normalShopLink = $item.find('a[href*="/shop/"], a[href*="/search?step=1&shop="]')

      if (shopLink.length > 0) {
        shopName = shopLink.text().trim()
      } else if (normalShopLink.length > 0) {
        shopName = normalShopLink.text().trim()
      }

      if (!shopName) {
        shopName = 'トレファクONLINE'
      }

      // 在庫状況
      const status = STOCK_STATUS.AVAILABLE

      const uniqueKey = uuidv4()
      const itemCode = itemHref.split('/').pop() || ''

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

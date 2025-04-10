import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildQuerySurugayaStep } from './build-query.surugaya.step'
import fs from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'
import type { ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS, StockStatus } from '@/common/domains/types/stock-status'
import { generateUniqueKey } from '@/server/server-lib/uuid'
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

const pageCrawlerSurugayaStep = new Step({
  id: 'pageCrawlerStep',
  inputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  outputSchema: z.object({
    products: z.array(productSchema),
  }),
  execute: async ({ context }) => {
    const keyword = context.getStepResult(buildQuerySurugayaStep)?.keyword
    const options = context.getStepResult(buildQuerySurugayaStep)?.options
    const promptUniqueKey = context.triggerData?.promptUniqueKey as string

    if (!keyword || !options) {
      throw new Error('Failed to get keyword or options')
    }

    if (!promptUniqueKey) {
      throw new Error('Failed to get promptUniqueKey')
    }

    try {
      // 検索URLの構築
      const baseUrl = 'https://www.suruga-ya.jp/search'
      const searchParams = new URLSearchParams()
      searchParams.append('search_word', keyword)
      // オプションを追加
      Object.entries(options).forEach(([key, value]) => {
        if (key !== 'search_word') {
          searchParams.append(key, value)
        }
      })
      const initialUrl = `${baseUrl}?${searchParams.toString()}`
      console.log('Initial URL:', initialUrl)

      // 一時ディレクトリを作成
      const tmpDir = path.join(process.cwd(), 'tmp', 'surugaya-pages')
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

      // 検索結果の総数を取得
      const totalItemsText =
        $('body')
          .text()
          .match(/該当件数:([0-9,]+)件/)?.[1] || '0'
      const totalItems = parseInt(totalItemsText.replace(/,/g, ''))
      console.log('Total search results:', totalItems)

      // 1ページあたり24件で計算（テスト用に1ページのみに制限）
      const maxPage = Math.min(Math.ceil(totalItems / 24), 2)
      console.log(`Total pages to fetch: ${maxPage}`)

      // 全ページのURLを生成
      const urls = Array.from({ length: maxPage }, (_, i) => {
        const pageParams = new URLSearchParams(searchParams)
        pageParams.set('page', (i + 1).toString())
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
              fs.writeFileSync(path.join(debugDir, `surugaya-page-${index + 1}.html`), html)
              console.log(`Saved debug HTML to surugaya-page-${index + 1}.html`)
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
                  'surugaya',
                  isPartial,
                )
              } else {
                console.log(`ロックが取得できなかったため待機中... (Surugaya, Page ${index + 1})`)
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
                    'surugaya',
                    isPartial,
                  )
                } else {
                  console.error(
                    `ロックが取得できませんでした。データは保存されません (Surugaya, Page ${index + 1})`,
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

export { pageCrawlerSurugayaStep }

// HTMLをProductEntityに変換する関数
const mapHtmlToProducts = (html: string): ProductEntity[] => {
  const $ = cheerio.load(html)
  const products: ProductEntity[] = []

  $('#search_result .item, .item_list li').each((_, element) => {
    try {
      const $item = $(element)

      // タイトルと商品URL
      const $titleLink = $item.find('.title_link, .title h3.product-name')
      const jaTitle = $titleLink.text().trim()
      const url = $titleLink.attr('href') || $item.find('.title a').attr('href') || ''
      const fullUrl = url.startsWith('http') ? url : `https://www.suruga-ya.jp${url}`

      // 価格情報の取得
      const priceText = $item.find('.price_teika').text().trim()
      let price = 0
      let priceWithTax = 0

      // 通常価格のパース
      const normalPriceMatch = priceText.match(/[￥¥]([\d,]+)/)
      if (normalPriceMatch) {
        price = parseInt(normalPriceMatch[1].replace(/[^\d]/g, ''))
        priceWithTax = price
      }

      // 税込価格の取得
      const taxIncludedText = $item.find('.price_taxin').text().trim()
      if (taxIncludedText) {
        const taxMatch = taxIncludedText.match(/[￥¥]([\d,]+)/)
        if (taxMatch) {
          priceWithTax = parseInt(taxMatch[1].replace(/[^\d]/g, ''))
        }
      }

      // 商品画像URL
      const imageUrl =
        $item.find('.photo_box img, .thum img').attr('data-src') ||
        $item.find('.photo_box img, .thum img').attr('src') ||
        ''
      const fullImageUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `https://www.suruga-ya.jp${imageUrl}`

      // 商品状態のテキスト
      const statusText =
        $item.find('.stock_status, .status_text').text().trim() ||
        ($item.find('.price').text().includes('品切れ') ? '品切れ' : '在庫あり')

      // 在庫状態をStockStatusに変換
      let status: StockStatus = STOCK_STATUS.UNKNOWN
      if (statusText.includes('在庫あり') || statusText.includes('在庫あります')) {
        status = STOCK_STATUS.AVAILABLE
      } else if (statusText.includes('品切れ') || statusText.includes('在庫なし')) {
        status = STOCK_STATUS.OUT_OF_STOCK
      } else if (statusText.includes('確認')) {
        status = STOCK_STATUS.REQUIRES_USER_CONFIRMATION
      }

      // 商品の状態（コンディション）
      const condition = $item.find('.condition_text, .condition').text().trim() || '状態不明'

      // 商品コード
      let itemCode = ''
      const itemCodeText = $item.find('.item_code').text().trim()
      const itemCodeMatch = url.match(/detail\/(\d+)/) || itemCodeText.match(/(\d+)/)
      if (itemCodeMatch) {
        itemCode = itemCodeMatch[1]
      } else {
        itemCode = url.split('/').pop()?.split('.')[0] || '0'
      }

      // ブランド情報
      const brandMatch = $item
        .find('.brand')
        .text()
        .match(/\[(.*?)\]/)
      const shopInfo = brandMatch ? brandMatch[1].trim() : ''

      // 新着フラグ
      const isNewArrival = $item.find('.new_arrival').length > 0

      if (!jaTitle || !price) {
        console.log('Skipping item due to missing required fields:', { jaTitle, price })
        return
      }

      products.push({
        uniqueKey: generateUniqueKey(),
        title: {
          ja: jaTitle,
          en: jaTitle, // 英語タイトルは現時点では日本語と同じ
        },
        price,
        priceWithTax,
        currency: 'JPY',
        condition: condition || '',
        description: shopInfo || '',
        url: fullUrl,
        imageUrl: fullImageUrl,
        status,
        itemCode,
        shopName: 'surugaya',
        shopIconUrl: 'https://www.suruga-ya.jp/favicon.ico',
      })
    } catch (itemError) {
      console.error('Error parsing item data:', itemError)
    }
  })

  return products
}

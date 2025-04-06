import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildQueryToysrusStep } from './build-query.toysrus.step'
import { ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS, type StockStatus } from '@/common/domains/types/stock-status'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'
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

const pageCrawlerToysrusStep = new Step({
  id: 'pageCrawlerStep',
  inputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  outputSchema: z.object({
    products: z.array(productSchema),
  }),
  execute: async ({ context }) => {
    const keyword = context.getStepResult(buildQueryToysrusStep)?.keyword
    const options = context.getStepResult(buildQueryToysrusStep)?.options
    const promptUniqueKey = context.triggerData?.promptUniqueKey as string

    if (!keyword || !options) {
      throw new Error('Failed to get keyword or options')
    }

    if (!promptUniqueKey) {
      throw new Error('Failed to get promptUniqueKey')
    }

    try {
      // 検索URLの構築
      const baseUrl = 'https://www.toysrus.co.jp/ja-jp/search'
      const searchParams = new URLSearchParams()
      searchParams.append('q', keyword)
      // オプションを追加
      Object.entries(options).forEach(([key, value]) => {
        if (key !== 'q') {
          searchParams.append(key, value)
        }
      })
      const initialUrl = `${baseUrl}?${searchParams.toString()}`
      console.log('Initial URL:', initialUrl)

      // 一時ディレクトリを作成
      const tmpDir = path.join(process.cwd(), 'tmp', 'toysrus-pages')
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
      const totalItemsText = $('.result-count').text().trim() || $('.product-count').text().trim()
      const totalItemsMatch =
        totalItemsText.match(/(\d+)件/) || totalItemsText.match(/表示\s+(\d+)\s+\/\s+(\d+)\s+件/)
      const totalItems = totalItemsMatch ? parseInt(totalItemsMatch[totalItemsMatch.length - 1]) : 0
      console.log('Total search results text:', totalItemsText)
      console.log('Total search results:', totalItems)

      // 1ページあたり48件で計算（テスト用に2ページのみに制限）
      const itemsPerPage = 48
      const maxPage = Math.min(Math.ceil(totalItems / itemsPerPage), 2)
      console.log(`Total pages to fetch: ${maxPage}`)

      // 全ページのURLを生成
      const urls = Array.from({ length: maxPage }, (_, i) => {
        const pageParams = new URLSearchParams(searchParams)
        if (i > 0) {
          pageParams.set('start', (i * itemsPerPage).toString())
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
              fs.writeFileSync(path.join(debugDir, `toysrus-page-${index + 1}.html`), html)
              console.log(`Saved debug HTML to toysrus-page-${index + 1}.html`)
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
                  'toysrus',
                  isPartial,
                )
              } else {
                console.log(`ロックが取得できなかったため待機中... (Toysrus, Page ${index + 1})`)
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
                    'toysrus',
                    isPartial,
                  )
                } else {
                  console.error(
                    `ロックが取得できませんでした。データは保存されません (Toysrus, Page ${index + 1})`,
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

export { pageCrawlerToysrusStep }

// HTMLをProductEntityに変換する関数
const mapHtmlToProducts = (html: string): ProductEntity[] => {
  const $ = cheerio.load(html)
  const products: ProductEntity[] = []

  // 商品リストの要素を取得 - .product-tileセレクタに特化
  $('.product-tile').each((_, element) => {
    try {
      const $item = $(element)

      // data-metadata属性から商品情報を取得
      interface ProductMetadata {
        id?: string
        sku?: string
        name?: string
        name_local?: string
        price?: string
        location_id?: string
        category5?: string
        [key: string]: any
      }

      let metadata: ProductMetadata = {}
      try {
        const metadataStr = $item.attr('data-metadata')
        if (metadataStr) {
          metadata = JSON.parse(metadataStr) as ProductMetadata
          console.log('Successfully parsed metadata for product')
        }
      } catch (error) {
        console.error('Error parsing metadata JSON:', error)
      }

      // メタデータから情報を取得
      const jaTitle = metadata.name_local || metadata.name || ''
      const price = parseInt(metadata.price || '0') || 0

      // URLを取得（相対パスを絶対URLに変換）
      const $titleLink = $item.find('a').first()
      const url = $titleLink.attr('href') || ''
      const fullUrl = url.startsWith('http') ? url : `https://www.toysrus.co.jp${url}`

      // 画像URL（data-src属性を使用）
      const $img = $item.find('img')
      const imageUrl = $img.attr('data-src') || $img.attr('src') || ''
      const fullImageUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `https://www.toysrus.co.jp${imageUrl}`

      // 在庫情報（メタデータまたはHTMLから）
      let status: StockStatus = STOCK_STATUS.UNKNOWN
      const locationId = metadata.location_id || ''
      const isOutOfStock =
        $item.find('.out-of-stock, .sold-out, .unavailable').length > 0 ||
        locationId === 'out_of_stock'
      const statusText = $item.find('.availability, .stock-status, .product-status').text().trim()

      if (isOutOfStock || statusText.includes('在庫なし') || statusText.includes('品切れ')) {
        status = STOCK_STATUS.OUT_OF_STOCK
      } else if (
        jaTitle.includes('予約受付') ||
        jaTitle.includes('予約商品') ||
        statusText.includes('予約受付中') ||
        statusText.includes('予約')
      ) {
        status = STOCK_STATUS.PRE_ORDER
      } else {
        status = STOCK_STATUS.AVAILABLE
      }

      // 商品コード
      let itemCode = metadata.id || metadata.sku || ''
      if (!itemCode) {
        const itemCodeMatch = url.match(/\/([^\/]+)\.html/) || url.match(/\/(\d+-\d+)/)
        if (itemCodeMatch) {
          itemCode = itemCodeMatch[1]
        } else {
          itemCode = generateUniqueKey().substring(0, 10)
        }
      }

      // デバッグログ
      console.log('Parsed product:', {
        title: jaTitle,
        price,
        url: fullUrl,
        imageUrl: fullImageUrl,
        status,
        metadata: !!Object.keys(metadata).length,
      })

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
        priceWithTax: price, // 日本は税込み表示
        currency: 'JPY',
        condition: '',
        description: metadata.category5 || '', // 年齢情報を説明に
        url: fullUrl,
        imageUrl: fullImageUrl,
        status,
        itemCode,
        shopName: 'toysrus',
        shopIconUrl: 'https://www.toysrus.co.jp/favicon.ico',
      })
    } catch (itemError) {
      console.error('Error parsing item data:', itemError)
    }
  })

  // 商品が見つからなかった場合のデバッグ情報
  if (products.length === 0) {
    console.log('No products found. Checking HTML structure...')
    console.log('Page title:', $('title').text())
    console.log('Found product containers:', $('.product-tile').length)
    // ページの一部をログに出力してデバッグ
    console.log('HTML snippet:', html.substring(0, 500))
  }

  return products
}

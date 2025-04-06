import fs from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'
import { Step } from '@mastra/core/workflows'
import { type ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS, type StockStatus } from '@/common/domains/types/stock-status'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { promptProductSaver } from '@/server/server-lib/prompt-lock'
import { z } from 'zod'
import { buildQueryAmiAmiStep } from './build-query.amiami.step'

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

const pageCrawlerAmiAmiStep = new Step({
  id: 'pageCrawlerAmiAmiStep',
  inputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  outputSchema: z.object({
    products: z.array(productSchema),
  }),
  execute: async ({ context }) => {
    const keyword = context.getStepResult(buildQueryAmiAmiStep)?.keyword
    const options = context.getStepResult(buildQueryAmiAmiStep)?.options
    const promptUniqueKey = context.triggerData?.promptUniqueKey as string

    if (!keyword || !options) {
      throw new Error('Failed to get keyword or options')
    }

    if (!promptUniqueKey) {
      throw new Error('Failed to get promptUniqueKey')
    }

    try {
      // 検索URLの構築
      const baseUrl = 'https://slist.amiami.jp/top/search/list'
      const searchParams = new URLSearchParams()
      searchParams.append('s_keywords', keyword)
      // オプションを追加
      Object.entries(options).forEach(([key, value]) => {
        searchParams.append(key, value)
      })
      const initialUrl = `${baseUrl}?${searchParams.toString()}`
      console.log('Initial URL:', initialUrl)

      // 一時ディレクトリを作成
      const tmpDir = path.join(process.cwd(), 'tmp', 'amiami-pages')
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
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            Referer: 'https://www.amiami.jp/',
            'sec-ch-ua': '"Google Chrome";v="122", "Chromium";v="122", "Not(A:Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'same-site',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'Cache-Control': 'max-age=0',
            Connection: 'keep-alive',
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

      console.log('Initial response:', initialResponse)

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
        $('.search_result')
          .find('.list_count')
          .text()
          .trim()
          .match(/(\d+,?\d*)/)?.[1] || '0'
      const totalItems = parseInt(totalItemsText.replace(/,/g, ''))
      console.log('Total search results:', totalItems)

      // ページあたりの件数（デフォルトは60件）
      const itemsPerPage = options.pagemax ? parseInt(options.pagemax) : 60
      console.log('Items per page:', itemsPerPage)

      // 1ページあたりの件数で計算（テスト用に2ページに制限）
      const maxPage = Math.min(Math.ceil(totalItems / itemsPerPage), 2)
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
            const timeout = setTimeout(() => controller.abort(), 12000) // タイムアウト延長

            // ランダムな遅延（1〜3秒）を追加
            const delay = Math.floor(Math.random() * 2000) + 1000
            console.log(`Adding random delay of ${delay}ms before request`)
            await new Promise((resolve) => setTimeout(resolve, delay))

            let response
            try {
              response = await fetch(url, {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                  Accept:
                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                  'Accept-Encoding': 'gzip, deflate, br',
                  Referer: initialUrl,
                  'sec-ch-ua': '"Google Chrome";v="122", "Chromium";v="122", "Not(A:Brand";v="24"',
                  'sec-ch-ua-mobile': '?0',
                  'sec-ch-ua-platform': '"macOS"',
                  'sec-fetch-dest': 'document',
                  'sec-fetch-mode': 'navigate',
                  'sec-fetch-site': 'same-site',
                  'sec-fetch-user': '?1',
                  'upgrade-insecure-requests': '1',
                  'Cache-Control': 'max-age=0',
                  Connection: 'keep-alive',
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
              fs.writeFileSync(path.join(debugDir, `amiami-page-${index + 1}.html`), html)
              console.log(`Saved debug HTML to amiami-page-${index + 1}.html`)
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
                  'amiami',
                  isPartial,
                )
              } else {
                console.log(`ロックが取得できなかったため待機中... (AmiAmi, Page ${index + 1})`)
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
                    'amiami',
                    isPartial,
                  )
                } else {
                  console.error(
                    `ロックが取得できませんでした。データは保存されません (AmiAmi, Page ${index + 1})`,
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

export { pageCrawlerAmiAmiStep }

// HTMLをProductEntityに変換する関数
const mapHtmlToProducts = (html: string): ProductEntity[] => {
  const $ = cheerio.load(html)
  const products: ProductEntity[] = []

  // 商品リストの各アイテムを処理
  $('.product_box').each((_, element) => {
    try {
      const $item = $(element)

      // タイトルと商品URL
      const $titleLink = $item.find('.product_name a')
      const jaTitle = $titleLink.text().trim()
      const url = $titleLink.attr('href') || ''
      const fullUrl = url.startsWith('http') ? url : `https://www.amiami.jp${url}`

      // 価格情報の取得
      const priceText = $item.find('.product_price').text().trim()
      let price = 0
      let priceWithTax = 0

      // 通常価格のパース（¥X,XXX形式）
      const normalPriceMatch = priceText.match(/[￥¥]?(\d[\d,]+)/)
      if (normalPriceMatch) {
        price = parseInt(normalPriceMatch[1].replace(/[,]/g, ''))
        priceWithTax = price // AmiAmiはデフォルトで税込表示
      }

      // 商品画像URL
      // 実際の画像URLを取得（data-srcが存在する場合はそれを優先）
      let imageUrl =
        $item.find('.product_img img').attr('data-src') ||
        $item.find('.product_img img').attr('src') ||
        ''

      // もし画像がブランクGIFの場合は、別の属性を探す
      if (imageUrl.includes('blank.gif')) {
        // data-origをチェック
        const dataOrig = $item.find('.product_img img').attr('data-orig')
        if (dataOrig) {
          imageUrl = dataOrig
        }
      }

      const fullImageUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `https://www.amiami.jp${imageUrl}`

      // 商品コードを抽出
      let itemCode = ''
      const itemCodeMatch =
        url.match(/gcode=([A-Z0-9-]+)/) ||
        url.match(/\/detail\/detail\?(?:scode|gcode)=([A-Z0-9-]+)/) ||
        url.match(/\/(\w+)\.html/)
      if (itemCodeMatch) {
        itemCode = itemCodeMatch[1]
      } else {
        // URLからitemCodeを取得できない場合、画像パスから取得を試みる
        const imgCodeMatch = imageUrl.match(/\/([A-Z0-9-]+)\.(jpg|png|gif)$/)
        if (imgCodeMatch) {
          itemCode = imgCodeMatch[1]
        } else {
          // 最終手段として一意のIDを生成
          itemCode = generateUniqueKey().substring(0, 10)
        }
      }

      // 在庫状態を判断する
      let status: StockStatus = STOCK_STATUS.AVAILABLE // デフォルトは在庫あり

      // 「予約」「取寄」「品切れ」などのテキストを探す
      const $statusElements = $item.find('*').filter(function () {
        const text = $(this).text().trim()
        return (
          text.includes('予約') ||
          text.includes('取寄') ||
          text.includes('品切') ||
          text.includes('売切') ||
          text.includes('中古')
        )
      })

      if ($statusElements.length > 0) {
        const statusText = $statusElements.first().text().trim()

        if (statusText.includes('予約')) {
          status = STOCK_STATUS.PRE_ORDER
        } else if (statusText.includes('品切') || statusText.includes('売切')) {
          status = STOCK_STATUS.OUT_OF_STOCK
        } else if (statusText.includes('取寄')) {
          status = STOCK_STATUS.REQUIRES_USER_CONFIRMATION
        }
      }

      // 商品の状態（コンディション）
      let condition = '新品'

      // 「中古」というテキストを探す
      const $conditionElements = $item.find('*').filter(function () {
        return $(this).text().trim().includes('中古')
      })

      if ($conditionElements.length > 0) {
        condition = '中古'
      }

      // 商品説明（メーカー名など）
      // メーカー名を探す
      let description = ''
      const $makerElements = $item.find('.product_maker, .maker')
      if ($makerElements.length > 0) {
        description = $makerElements.text().trim()
      }

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
        condition,
        description,
        url: fullUrl,
        imageUrl: fullImageUrl,
        status,
        itemCode,
        shopName: 'amiami',
        shopIconUrl: 'https://www.amiami.jp/images/favicon.png',
      })
    } catch (itemError) {
      console.error('Error parsing item data:', itemError)
    }
  })

  return products
}

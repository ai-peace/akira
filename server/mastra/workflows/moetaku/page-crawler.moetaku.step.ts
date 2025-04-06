import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildMoetakuQueryStep } from './build-query.moetaku.step'
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

const pageCrawlerMoetakuStep = new Step({
  id: 'pageCrawlerMoetakuStep',
  inputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
    searchUrl: z.string().optional(),
  }),
  outputSchema: z.object({
    products: z.array(productSchema),
  }),
  execute: async ({ context }) => {
    const stepResult = context.getStepResult(buildMoetakuQueryStep)
    const keyword = stepResult?.keyword
    const options = stepResult?.options
    const searchUrl = stepResult?.searchUrl
    const promptUniqueKey = context.triggerData?.promptUniqueKey as string

    if (!keyword || !options) {
      throw new Error('Failed to get keyword or options')
    }

    if (!promptUniqueKey) {
      throw new Error('Failed to get promptUniqueKey')
    }

    try {
      // 検索URLを使用または構築
      const baseUrl = 'https://www.netoff.co.jp/figure/purchase/'
      const initialUrl =
        searchUrl ||
        (() => {
          const params = new URLSearchParams()
          params.append('ky', keyword)
          Object.entries(options).forEach(([key, value]) => {
            params.append(key, value)
          })
          return `${baseUrl}?${params.toString()}`
        })()

      console.log('Initial URL:', initialUrl)

      // 一時ディレクトリを作成
      const tmpDir = path.join(process.cwd(), 'tmp', 'moetaku-pages')
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
        $('.result_amount')
          .text()
          .trim()
          .match(/([0-9,]+)件/)?.[1] || '0'
      const totalItems = parseInt(totalItemsText.replace(/,/g, ''))
      console.log('Total search results:', totalItems)

      // ページネーション情報を取得
      const pagination = $('.pagination')
      const pageLinks = pagination.find('a')
      let maxPage = 1

      if (pageLinks.length > 0) {
        pageLinks.each((_, element) => {
          const pageNum = parseInt($(element).text().trim())
          if (!isNaN(pageNum) && pageNum > maxPage) {
            maxPage = pageNum
          }
        })
      }

      // テスト用に最大2ページまでに制限
      maxPage = Math.min(maxPage, 2)
      console.log(`Total pages to fetch: ${maxPage}`)

      // 全ページのURLを生成
      const urls = Array.from({ length: maxPage }, (_, i) => {
        const pageNum = i + 1
        if (pageNum === 1) return finalUrl
        return finalUrl.includes('?')
          ? `${finalUrl}&page=${pageNum}`
          : `${finalUrl}?page=${pageNum}`
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

            // レスポンスをテキストとして取得
            const html = await response.text()
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
              fs.writeFileSync(path.join(debugDir, `moetaku-page-${index + 1}.html`), html)
              console.log(`Saved debug HTML to moetaku-page-${index + 1}.html`)
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
                  'moetaku',
                  isPartial,
                )
              } else {
                console.log(`ロックが取得できなかったため待機中... (もえたく！, Page ${index + 1})`)
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
                    'moetaku',
                    isPartial,
                  )
                } else {
                  console.error(
                    `ロックが取得できませんでした。データは保存されません (もえたく！, Page ${index + 1})`,
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

export { pageCrawlerMoetakuStep }

// HTMLをProductEntityに変換する関数
const mapHtmlToProducts = (html: string): ProductEntity[] => {
  const $ = cheerio.load(html)
  const products: ProductEntity[] = []

  $('.item_list .item_box').each((_, element) => {
    try {
      const $item = $(element)

      // タイトルと商品URL
      const $titleLink = $item.find('.item_name a')
      const jaTitle = $titleLink.text().trim()
      const relativeUrl = $titleLink.attr('href') || ''
      const fullUrl = relativeUrl.startsWith('http')
        ? relativeUrl
        : `https://www.netoff.co.jp${relativeUrl}`

      // 価格情報の取得
      const priceText = $item.find('.price').text().trim()
      let price = 0

      // 通常価格のパース（税抜き）
      const normalPriceMatch = priceText.match(/([\d,]+)円/)
      if (normalPriceMatch) {
        price = parseInt(normalPriceMatch[1].replace(/[^\d]/g, ''))
      }

      // 税込価格は現時点ではデータがないため、税抜き価格の1.1倍として計算
      const priceWithTax = Math.round(price * 1.1)

      // 商品画像URL
      const imageUrl = $item.find('.item_img img').attr('src') || ''
      const fullImageUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `https://www.netoff.co.jp${imageUrl}`

      // 商品状態のテキスト
      const statusText = $item.find('.status').text().trim()

      // 在庫状態をStockStatusに変換
      let status: StockStatus = STOCK_STATUS.UNKNOWN
      if (statusText.includes('在庫あり')) {
        status = STOCK_STATUS.AVAILABLE
      } else if (statusText.includes('品切れ') || statusText.includes('在庫なし')) {
        status = STOCK_STATUS.OUT_OF_STOCK
      } else if (statusText.includes('確認')) {
        status = STOCK_STATUS.REQUIRES_USER_CONFIRMATION
      }

      // 商品の状態（コンディション）
      const condition = $item.find('.condition').text().trim() || '状態不明'

      // 商品コード
      let itemCode = ''
      const itemCodeMatch = relativeUrl.match(/\/item\/(\d+)/)
      if (itemCodeMatch) {
        itemCode = itemCodeMatch[1]
      } else {
        // URLから商品コードが取得できない場合は一意のIDを生成
        itemCode = `moetaku-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      }

      // 説明文
      const description = $item.find('.item_description').text().trim()

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
        description: description || '',
        url: fullUrl,
        imageUrl: fullImageUrl,
        status,
        itemCode,
        shopName: 'moetaku',
        shopIconUrl: 'https://www.netoff.co.jp/favicon.ico',
      })
    } catch (itemError) {
      console.error('Error parsing item data:', itemError)
    }
  })

  return products
}

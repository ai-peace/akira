import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'
import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildQueryMoetakuStep } from './build-query.moetaku.step'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { type ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS, type StockStatus } from '@/common/domains/types/stock-status'
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
  }),
  outputSchema: z.object({
    products: z.array(productSchema),
  }),
  execute: async ({ context }) => {
    const keyword = context.getStepResult(buildQueryMoetakuStep)?.keyword
    const options = context.getStepResult(buildQueryMoetakuStep)?.options
    const promptUniqueKey = context.triggerData?.promptUniqueKey as string

    if (!keyword || !options) {
      throw new Error('Failed to get keyword or options')
    }

    if (!promptUniqueKey) {
      throw new Error('Failed to get promptUniqueKey')
    }

    try {
      // 検索URLの構築
      const baseUrl = 'https://www.netoff.co.jp/figure/purchase/'
      const searchParams = new URLSearchParams()
      searchParams.append('ky', keyword)
      searchParams.append('t', 'w') // 基本検索タイプ

      // オプションを追加
      Object.entries(options).forEach(([key, value]) => {
        searchParams.append(key, value)
      })

      const initialUrl = `${baseUrl}?${searchParams.toString()}`
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
        $('h2')
          .text()
          .match(/『.+』(\d+)点買取/)?.[1] || '0'
      const totalItems = parseInt(totalItemsText.replace(/,/g, ''))
      console.log('Total search results:', totalItems)

      // もえたく！は1ページあたり30件表示
      const itemsPerPage = 30
      const maxPage = Math.min(Math.ceil(totalItems / itemsPerPage), 5) // 最大5ページまでに制限
      console.log(`Total pages to fetch: ${maxPage}`)

      // 全ページのURLを生成
      const urls = Array.from({ length: maxPage }, (_, i) => {
        if (i === 0) return initialUrl // 最初のページは既に取得済みのURLを使用
        const pageParams = new URLSearchParams(searchParams)
        pageParams.set('pg', (i + 1).toString())
        return `${baseUrl}?${pageParams.toString()}`
      })

      const allProducts: ProductEntity[] = []

      // 最初のページの商品を抽出
      const initialProducts = mapHtmlToProducts(initialHtml)
      console.log(`Extracted ${initialProducts.length} products from initial page`)
      allProducts.push(...initialProducts)

      // 最初のページの結果を保存
      let initialLockAcquired = false
      try {
        initialLockAcquired = promptProductSaver.acquireLock(promptUniqueKey)
        if (initialLockAcquired) {
          const isPartial = maxPage > 1
          await promptProductSaver.saveProducts(
            promptUniqueKey,
            initialProducts,
            'moetaku',
            isPartial,
          )
        } else {
          console.error('初期ページの結果保存のためにロックが取得できませんでした')
        }
      } finally {
        if (initialLockAcquired) {
          promptProductSaver.releaseLock(promptUniqueKey)
        }
      }

      // 最初のページ以降をクロール（2ページ目から）
      if (maxPage > 1) {
        // URLからHTMLを取得して処理
        await Promise.all(
          urls.slice(1).map(async (url: string, index: number) => {
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
                    'Sec-Ch-Ua':
                      '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
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
              const fileName = `page_${index + 2}.html` // index + 2 because we're starting from page 2
              const filePath = path.join(tmpDir, fileName)
              console.log(`Saving HTML to: ${filePath}`)
              fs.writeFileSync(filePath, html, 'utf-8')

              // デバッグ用にHTMLを保存
              try {
                const debugDir = path.join(process.cwd(), 'debug')
                if (!fs.existsSync(debugDir)) {
                  fs.mkdirSync(debugDir, { recursive: true })
                }
                fs.writeFileSync(path.join(debugDir, `moetaku-page-${index + 2}.html`), html)
                console.log(`Saved debug HTML to moetaku-page-${index + 2}.html`)
              } catch (error) {
                console.error('Failed to save debug HTML:', error)
              }

              // HTMLからProductEntityに変換
              const pageProducts = mapHtmlToProducts(html)
              console.log(`Extracted ${pageProducts.length} products from page ${index + 2}`)

              // プロンプトに直接結果を追加（ロックを使用）
              let lockAcquired = false
              try {
                lockAcquired = promptProductSaver.acquireLock(promptUniqueKey)
                if (lockAcquired) {
                  const isPartial = index < urls.length - 2 // 最後のページでなければpartial
                  await promptProductSaver.saveProducts(
                    promptUniqueKey,
                    pageProducts,
                    'moetaku',
                    isPartial,
                  )
                } else {
                  console.log(`ロックが取得できなかったため待機中... (Moetaku, Page ${index + 2})`)
                  // ロック取得を試みるシンプルな再試行ロジック
                  let retries = 0
                  while (!lockAcquired && retries < 5) {
                    await new Promise((resolve) => setTimeout(resolve, 500))
                    lockAcquired = promptProductSaver.acquireLock(promptUniqueKey)
                    retries++
                  }

                  if (lockAcquired) {
                    const isPartial = index < urls.length - 2
                    await promptProductSaver.saveProducts(
                      promptUniqueKey,
                      pageProducts,
                      'moetaku',
                      isPartial,
                    )
                  } else {
                    console.error(
                      `ロックが取得できませんでした。データは保存されません (Moetaku, Page ${index + 2})`,
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
      }

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

  console.log('Starting HTML parsing for products')

  // デバッグ情報
  const heading = $('h2').text().trim()
  console.log('Page heading:', heading)

  // 商品リストを特定 - 現在のDOM構造に合わせて修正
  $('body list').each((index, element) => {
    try {
      // 商品詳細ページへのリンクを確認
      const $titleLink = $(element).find('listitem link[href*="/moetaku/detail/"]')
      if ($titleLink.length === 0) {
        return // 詳細ページへのリンクがない場合はスキップ
      }

      // 価格情報が含まれているか確認
      const hasPrice = $(element).text().includes('円買取')
      if (!hasPrice) {
        return // 価格情報がない場合はスキップ
      }

      // 画像の有無を確認
      const hasImage = $(element).find('img').length > 0
      if (!hasImage) {
        return // 画像がない場合はスキップ
      }

      // 商品タイトル
      const $heading = $(element).find('heading[level="3"]').first()
      let productTitle = $heading.text().trim()

      if (!productTitle) {
        // ヘッディングが見つからない場合、リンクのテキストを使用
        productTitle = $titleLink.text().trim()
      }

      if (!productTitle) {
        return // タイトルが取得できない場合はスキップ
      }

      // 商品詳細URL
      const productLinkHref = $titleLink.attr('href') || ''
      if (!productLinkHref.includes('/moetaku/detail/')) {
        return // 詳細URLが適切でない場合はスキップ
      }

      // 完全なURLを構築
      const fullUrl = productLinkHref.startsWith('http')
        ? productLinkHref
        : `https://www.netoff.co.jp${productLinkHref}`

      // 商品コード（URLから抽出）
      const itemCode = productLinkHref.split('/').pop() || generateUniqueKey().substring(0, 8)

      // 画像URL
      const $img = $(element).find('img').first()
      const imageUrl = $img.attr('src') || ''
      const fullImageUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `https://www.netoff.co.jp${imageUrl}`

      // 価格テキストを検索
      let priceText = ''
      let price = 0

      // 値段テキストを検索 - "円買取" を含む要素を探す
      $(element)
        .find('listitem')
        .each((_, item) => {
          const itemText = $(item).text().trim()
          if (itemText.includes('円買取')) {
            priceText = itemText
            return false // ループを抜ける
          }
        })

      if (!priceText) {
        // まだ見つからない場合は全テキストを探索
        const allText = $(element).text()
        const priceMatch = allText.match(/(\d[\d,]+)\s*円買取/)
        if (priceMatch) {
          priceText = priceMatch[0]
        }
      }

      // 価格を抽出
      const priceMatch = priceText.match(/(\d[\d,]+)\s*円買取/)
      price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0

      // 有効な商品データでない場合はスキップ
      if (!productTitle || !price) {
        return
      }

      console.log(`商品を検出: "${productTitle}" 価格: ${price}円`)

      // メーカーとシリーズ情報を取得
      let manufacturer = ''
      let series = ''

      // メーカー情報を取得しようとする
      $(element)
        .find('listitem')
        .each((_, item) => {
          const $links = $(item).find('link')
          $links.each((_, link) => {
            const linkText = $(link).text().trim()
            const href = $(link).attr('href') || ''

            if (!linkText) return

            // メーカー情報の可能性がある場合
            if (href.includes('/figure/purchase/?mk=') || href.includes('/figure/purchase/?ky=')) {
              if (!manufacturer && isManufacturer(linkText)) {
                manufacturer = linkText
              }
            }

            // シリーズ情報の可能性がある場合
            if (href.includes('/figure/purchase/?sr=') || href.includes('/figure/purchase/?ky=')) {
              if (!series && isSeries(linkText)) {
                series = linkText
              }
            }
          })
        })

      // 未開封品かどうか
      const isUnopened = $(element).text().includes('未開封品')
      const condition = isUnopened ? '未開封品' : ''

      // 説明文を構築
      let description = ''
      if (manufacturer && series) {
        description = `${manufacturer} / ${series}`
      } else if (manufacturer) {
        description = manufacturer
      } else if (series) {
        description = series
      }

      // 商品データを追加
      products.push({
        uniqueKey: generateUniqueKey(),
        title: {
          ja: productTitle,
          en: productTitle, // 英語タイトルは現時点では日本語と同じ
        },
        price,
        priceWithTax: price, // もえたく！では表示価格が税込価格
        currency: 'JPY',
        condition,
        description,
        url: fullUrl,
        imageUrl: fullImageUrl,
        status: STOCK_STATUS.AVAILABLE, // もえたく！は基本的に全て買取可能
        itemCode,
        shopName: 'moetaku',
        shopIconUrl: 'https://www.netoff.co.jp/favicon.ico',
      })
    } catch (itemError) {
      console.error('Error parsing item data:', itemError)
    }
  })

  console.log(`抽出した商品の総数: ${products.length}`)
  return products
}

// メーカーかどうかを判断するヘルパー関数
function isManufacturer(text: string): boolean {
  const manufacturers = [
    'バンプレスト',
    'バンダイ',
    'メガハウス',
    'ボークス',
    'ホットトイズ',
    'フリュー',
    'メディコム・トイ',
    'プレックス',
    'BANDAI SPIRITS',
    'タイトー',
    'セガ',
    'アニプレックス',
    'ブロッコリー',
    'コトブキヤ',
    'グッドスマイルカンパニー',
  ]
  return (
    manufacturers.some((m) => text.includes(m)) ||
    text.includes('カンパニー') ||
    text.includes('コーポレーション') ||
    text.includes('トイ')
  )
}

// シリーズかどうかを判断するヘルパー関数
function isSeries(text: string): boolean {
  const seriesKeywords = [
    'シリーズ',
    'figma',
    'ねんどろいど',
    '一番くじ',
    'UDF',
    'VCD',
    'ROBOT魂',
    'Portrait.Of.Pirates',
    'KING OF ARTIST',
    'Grandista',
    'ワールドコレクタブル',
    'フィギュアーツZERO',
  ]
  return seriesKeywords.some((s) => text.includes(s))
}

// 他のファイルからインポートできるようにエクスポート
export { mapHtmlToProducts }

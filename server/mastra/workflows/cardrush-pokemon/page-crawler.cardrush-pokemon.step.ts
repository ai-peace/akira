import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildQueryCardrushPokemonStep } from './build-query.cardrush-pokemon.step'
import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'
import { ProductEntity } from '@/common/domains/entities/product.entity'
import { StockStatus, STOCK_STATUS } from '@/common/domains/types/stock-status'
import { promptProductSaver } from '@/server/server-lib/prompt-lock'
import { generateUniqueKey } from '@/server/server-lib/uuid'

// 新しいデバッグヘルパー関数を追加
function saveDebugFile(fileName: string, content: string): void {
  try {
    const debugDir = path.join(process.cwd(), 'debug')
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true })
    }

    fs.writeFileSync(path.join(debugDir, fileName), content)
    console.log(`Saved debug file: ${fileName}`)
  } catch (error) {
    console.error(`Failed to save debug file ${fileName}:`, error)
  }
}

// JSON保存ヘルパー
function saveDebugJSON(fileName: string, data: any): void {
  try {
    saveDebugFile(fileName, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Failed to save debug JSON ${fileName}:`, error)
  }
}

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

const pageCrawlerCardrushPokemonStep = new Step({
  id: 'pageCrawlerCardrushPokemonStep',
  inputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  outputSchema: z.object({
    products: z.array(productSchema),
  }),
  execute: async ({ context }) => {
    const keyword = context.getStepResult(buildQueryCardrushPokemonStep)?.keyword
    const options = context.getStepResult(buildQueryCardrushPokemonStep)?.options
    const promptUniqueKey = context.triggerData?.promptUniqueKey as string

    if (!keyword || !options) {
      throw new Error('Failed to get keyword or options')
    }

    if (!promptUniqueKey) {
      throw new Error('Failed to get promptUniqueKey')
    }

    try {
      // 検索URLの構築
      const baseUrl = 'https://www.cardrush-pokemon.jp/product-list'
      const searchParams = new URLSearchParams()
      searchParams.append('keyword', keyword)
      searchParams.append('Submit', '検索')

      // オプションを追加
      Object.entries(options).forEach(([key, value]) => {
        if (key !== 'keyword' && key !== 'Submit' && key !== 'stock') {
          searchParams.append(key, value)
        }
      })

      const initialUrl = `${baseUrl}?${searchParams.toString()}`
      console.log('Initial URL:', initialUrl)

      // デバッグ情報を保存
      saveDebugFile(
        'cardrush-pokemon-query.txt',
        `Keyword: ${keyword}\nOptions: ${JSON.stringify(options, null, 2)}\nURL: ${initialUrl}`,
      )

      // 一時ディレクトリを作成
      const tmpDir = path.join(process.cwd(), 'tmp', 'cardrush-pokemon-pages')
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
        // デバッグ情報を保存
        saveDebugFile('cardrush-pokemon-error.txt', `Error fetching initial page: ${error}`)
        // 初期ページの取得に失敗した場合は空の結果を返す
        return {
          products: [],
        }
      }

      if (!initialResponse.ok) {
        console.error(`HTTP error for initial page! status: ${initialResponse.status}`)
        // デバッグ情報を保存
        saveDebugFile(
          'cardrush-pokemon-error.txt',
          `HTTP error for initial page! status: ${initialResponse.status}, statusText: ${initialResponse.statusText}`,
        )
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

      // デバッグ: HTMLタイトルを保存
      console.log('Page title:', $('title').text())
      // デバッグ: 全文保存
      saveDebugFile('cardrush-pokemon-initial.html', initialHtml)

      // 検索結果の総数を取得
      const totalItemsText = $('.search_result_num').text().trim() || '0件'
      const totalItemsMatch = totalItemsText.match(/(\d+,?\d*)件/)
      let totalItems = totalItemsMatch ? parseInt(totalItemsMatch[1].replace(/,/g, '')) : 0
      console.log('Initial search count method:', totalItems)

      // アルタナティブな方法で検索結果数を取得する
      if (totalItems === 0) {
        // YAMLスナップショット形式から検索結果数を抽出する試み
        const paragraphWithCount = $('paragraph:contains("件")').text()
        const alternativeMatch = paragraphWithCount.match(/(\d+)件/)
        if (alternativeMatch) {
          totalItems = parseInt(alternativeMatch[1])
          console.log('Alternative search count method found:', totalItems)
        } else {
          // HTMLから直接検索
          const htmlMatch = initialHtml.match(/(\d+)件/)
          if (htmlMatch) {
            totalItems = parseInt(htmlMatch[1])
            console.log('Direct HTML search count method found:', totalItems)
          }
        }
      }

      // 検索結果が0でも、強制的に1ページは処理する（結果がある場合も）
      if (totalItems === 0) {
        console.log('No items found by count methods, but will still try to process the page')
        totalItems = 100 // 強制的に少なくとも1ページは処理
      }

      console.log('Total search results:', totalItems)

      // 1ページあたり100件で計算（テスト用に最大2ページに制限）
      const itemsPerPage = 100
      const maxPage = Math.min(Math.ceil(totalItems / itemsPerPage), 2)
      console.log(`Total pages to fetch: ${maxPage}`)

      // 全ページのURLを生成
      const urls = Array.from({ length: maxPage }, (_, i) => {
        // カードラッシュポケモンはページ番号が1から始まる
        const pageParams = new URLSearchParams(searchParams)
        if (i > 0) {
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
              fs.writeFileSync(path.join(debugDir, `cardrush-pokemon-page-${index + 1}.html`), html)
              console.log(`Saved debug HTML to cardrush-pokemon-page-${index + 1}.html`)
            } catch (error) {
              console.error('Failed to save debug HTML:', error)
            }

            // 在庫ありのみの場合、在庫チェックを実施
            const mustBeInStock = options.stock === 'in-stock'

            // HTMLからProductEntityに変換
            const pageProducts = mapHtmlToProducts(html, mustBeInStock)
            console.log(`Extracted ${pageProducts.length} products from page ${index + 1}`)

            // デバッグ情報の保存
            saveDebugJSON(`cardrush-pokemon-products-${index + 1}.json`, pageProducts)

            // プロンプトに直接結果を追加（ロックを使用）
            let lockAcquired = false
            try {
              lockAcquired = promptProductSaver.acquireLock(promptUniqueKey)
              if (lockAcquired) {
                const isPartial = index < urls.length - 1
                await promptProductSaver.saveProducts(
                  promptUniqueKey,
                  pageProducts,
                  'cardrush-pokemon',
                  isPartial,
                )
              } else {
                console.log(
                  `ロックが取得できなかったため待機中... (CardRush Pokemon, Page ${index + 1})`,
                )
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
                    'cardrush-pokemon',
                    isPartial,
                  )
                } else {
                  console.error(
                    `ロックが取得できませんでした。データは保存されません (CardRush Pokemon, Page ${index + 1})`,
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

      // 最終結果をデバッグ用に保存
      saveDebugJSON('cardrush-pokemon-all-products.json', allProducts)

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
      // エラーログを保存
      saveDebugFile('cardrush-pokemon-error.txt', `Error in page crawler: ${e}`)
      // エラーをスローする代わりに空の結果を返す
      return {
        products: [],
      }
    }
  },
})

export { pageCrawlerCardrushPokemonStep }

// HTMLをProductEntityに変換する関数
const mapHtmlToProducts = (html: string, mustBeInStock: boolean = true): ProductEntity[] => {
  const $ = cheerio.load(html)
  const products: ProductEntity[] = []

  console.log('HTML length:', html.length)
  console.log('Document title:', $('title').text())

  // デバッグ：商品リストのセレクタを特定するために、いくつかの候補を試す
  const selectors = [
    '.product_item',
    'main article ul > li',
    '.list_item',
    'li:has(a[href*="/product/"])',
    'article li',
    '.list_item, .itemlist li',
    'ul li:has(img[src*="product_image"])',
    '[ref*="listitem"]',
  ]

  let bestSelectorFound = ''
  let maxItems = 0

  selectors.forEach((selector) => {
    const count = $(selector).length
    console.log(`Selector "${selector}" found ${count} elements`)

    if (count > maxItems) {
      maxItems = count
      bestSelectorFound = selector
    }
  })

  console.log(`Best selector found: "${bestSelectorFound}" with ${maxItems} elements`)

  // データの存在確認
  console.log('Price elements found:', $('[ref*="price"]').length)
  console.log('Stock elements found:', $('[ref*="stock"], [ref*="zaiko"]').length)
  console.log('Image elements found:', $('img[src*="product_image"]').length)
  console.log('Product links found:', $('a[href*="/product/"]').length)
  console.log('Paragraph elements found:', $('paragraph').length)

  // YAMLスナップショット形式からの直接パターン検出
  if (html.includes('paragraph [ref=s') && products.length === 0) {
    console.log('Detected YAML snapshot format, trying direct extraction...')

    // 商品ブロックを正規表現で抽出する - YAMLスナップショット形式
    const productMatches = Array.from(
      html.matchAll(
        /listitem[^>]*>[\s\S]*?paragraph[^>]*>\s*"([^"<]+)"[\s\S]*?paragraph[^>]*>\s*(\d+,?\d*)\s*円[^<]*[\s\S]*?paragraph[^>]*>\s*在庫数\s*(\d+)枚/g,
      ),
    )

    console.log(`Found ${productMatches.length} products in YAML snapshot format`)

    productMatches.forEach((match, index) => {
      try {
        const jaTitle = normalizeText(match[1].trim())
        const price = parseInt(match[2].replace(/[^\d]/g, ''))
        const stockCount = parseInt(match[3])

        // URLを抽出する試み
        const urlRegex = new RegExp(
          `"${escapeRegExp(jaTitle)}"[^>]*>[\\s\\S]*?/url:\\s*([^\\s,]+)`,
          'i',
        )
        const urlMatch = html.match(urlRegex)
        const url = urlMatch ? urlMatch[1].trim() : ''

        if (jaTitle && price && (!mustBeInStock || stockCount > 0)) {
          console.log(`YAML extraction - Found: ${jaTitle}, price: ${price}, stock: ${stockCount}`)

          products.push({
            uniqueKey: generateUniqueKey(),
            title: {
              ja: jaTitle,
              en: jaTitle,
            },
            price,
            priceWithTax: price,
            currency: 'JPY',
            condition: jaTitle.includes('〔状態')
              ? jaTitle.match(/〔状態([A-Z\-]+)〕/)?.[1] || ''
              : '',
            description: '',
            url,
            imageUrl: '',
            status: stockCount > 0 ? STOCK_STATUS.AVAILABLE : STOCK_STATUS.OUT_OF_STOCK,
            itemCode: url.split('/').pop() || generateUniqueKey(),
            shopName: 'cardrush-pokemon',
            shopIconUrl: 'https://www.cardrush-pokemon.jp/favicon.ico',
          })
        }
      } catch (error) {
        console.error('Error parsing YAML product:', error)
      }
    })

    if (products.length > 0) {
      console.log(`Successfully extracted ${products.length} products from YAML format`)
      return products
    }
  }

  // そのほかのケースでの抽出処理を続行
  // 最適なセレクタを使用
  const itemSelector = bestSelectorFound || 'main article ul > li'
  console.log(`Using selector: ${itemSelector}`)

  // カードラッシュポケモンの商品リスト要素を選択
  $(itemSelector).each((_, element) => {
    try {
      const $item = $(element)

      // タイトルと商品URL
      const $titleLink = $item.find('a[href*="/product/"]').first()
      const rawTitle =
        $titleLink.text().trim() || $item.find('paragraph:contains("{")')?.text()?.trim()
      const jaTitle = normalizeText(rawTitle)
      const url = $titleLink.attr('href') || ''
      const fullUrl = url.startsWith('http') ? url : `https://www.cardrush-pokemon.jp${url}`

      // 価格情報の取得
      const priceText =
        normalizeText($item.find('[ref*="price"]').text()) ||
        normalizeText($item.text().match(/(\d+,?\d*)円/)?.[0] || '')
      let price = 0

      // 価格のパース
      const priceMatch = priceText.match(/([\d,]+)円/)
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/[^\d]/g, ''))
      }

      // 商品画像URL
      const imageUrl = $item.find('img').attr('src') || ''
      const fullImageUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `https://www.cardrush-pokemon.jp${imageUrl}`

      // 在庫状態の判定
      const stockText =
        $item.find('[ref*="stock"], [ref*="zaiko"]').text().trim() ||
        $item.text().match(/在庫数\s*\d+枚/)?.[0] ||
        ''

      // 在庫状態をStockStatusに変換
      let status: StockStatus = STOCK_STATUS.UNKNOWN

      if (
        stockText.includes('在庫あり') ||
        stockText.includes('在庫状況：あり') ||
        stockText.includes('在庫数')
      ) {
        status = STOCK_STATUS.AVAILABLE
      } else if (
        stockText.includes('在庫切れ') ||
        stockText.includes('品切れ') ||
        stockText.includes('在庫状況：なし')
      ) {
        status = STOCK_STATUS.OUT_OF_STOCK
      } else if (stockText.includes('お取り寄せ') || stockText.includes('受注発注')) {
        status = STOCK_STATUS.REQUIRES_USER_CONFIRMATION
      }

      // 在庫数を抽出
      const stockCountMatch = stockText.match(/在庫数\s*(\d+)枚/)
      if (stockCountMatch && parseInt(stockCountMatch[1]) > 0) {
        status = STOCK_STATUS.AVAILABLE
      }

      // 直接HTMLから在庫数を抽出する試み
      if (status === STOCK_STATUS.UNKNOWN) {
        const fullText = $item.text()
        const zaiko = fullText.match(/在庫数\s*(\d+)枚/)
        if (zaiko && parseInt(zaiko[1]) > 0) {
          status = STOCK_STATUS.AVAILABLE
          console.log(`Detected stock from full text: ${zaiko[0]}`)
        }
      }

      // 在庫ありのみ表示オプションが指定されている場合、在庫なしの商品はスキップ
      if (mustBeInStock && status !== STOCK_STATUS.AVAILABLE) {
        return
      }

      // 商品コード
      let itemCode = ''
      const itemCodeMatch = url.match(/\/product\/(\d+)/) || url.match(/\/([^\/]+)\.html/)
      if (itemCodeMatch) {
        itemCode = itemCodeMatch[1]
      } else {
        itemCode = url.split('/').pop()?.split('.')[0] || generateUniqueKey()
      }

      // 商品の状態（コンディション）
      let condition = ''

      // 商品名から状態情報を抽出（例: 〔状態A-〕マリィ【-】{160/184}）
      const conditionMatch = jaTitle.match(/〔状態([A-Z\-]+)〕/)
      if (conditionMatch) {
        condition = conditionMatch[1]
      }

      if (!jaTitle || !price) {
        console.log('Skipping item due to missing required fields:', { jaTitle, price })
        return
      }

      // デバッグ情報
      console.log(`Found product: ${jaTitle}, price: ${price}, stock: ${status}, url: ${fullUrl}`)

      products.push({
        uniqueKey: generateUniqueKey(),
        title: {
          ja: jaTitle,
          en: jaTitle, // 英語タイトルは現時点では日本語と同じ
        },
        price,
        priceWithTax: price, // カードラッシュポケモンでは税込価格が表示されている
        currency: 'JPY',
        condition: condition || '',
        description: '', // 詳細説明はリスト画面では取得できない
        url: fullUrl,
        imageUrl: fullImageUrl,
        status,
        itemCode,
        shopName: 'cardrush-pokemon',
        shopIconUrl: 'https://www.cardrush-pokemon.jp/favicon.ico',
      })
    } catch (itemError) {
      console.error('Error parsing item data:', itemError)
    }
  })

  // デバッグ情報
  console.log(`Total products extracted by parser: ${products.length}`)

  // 最後の手段: 特定の構造をもとに手動で抽出
  if (products.length === 0) {
    console.log('No products found. Trying manual extraction...')

    // 正規表現で商品情報を抽出する
    try {
      // 一般的なパターンで試行
      const generalPattern = /<button[^>]*>カートに入れる<\/button>/g
      const buttonMatches = html.match(generalPattern) || []
      console.log(`Found ${buttonMatches.length} "カートに入れる" buttons`)

      if (buttonMatches.length > 0) {
        // ボタンがある場合、その周辺のテキストを解析
        const productPattern =
          /([^<>"]*【[^<>"]*}[^<>"]*)"[\s\S]{1,500}?(\d+,?\d*)\s*円[\s\S]{1,200}?在庫数\s*(\d+)枚/g
        const matches = Array.from(html.matchAll(productPattern))

        console.log(`Found ${matches.length} products using general pattern`)

        matches.forEach((match) => {
          try {
            const jaTitle = normalizeText(match[1].trim())
            const price = parseInt(match[2].replace(/[^\d]/g, ''))
            const stockCount = parseInt(match[3])

            if (jaTitle && price && (!mustBeInStock || stockCount > 0)) {
              console.log(
                `Pattern extraction - Found: ${jaTitle}, price: ${price}, stock: ${stockCount}`,
              )

              products.push({
                uniqueKey: generateUniqueKey(),
                title: {
                  ja: jaTitle,
                  en: jaTitle,
                },
                price,
                priceWithTax: price,
                currency: 'JPY',
                condition: jaTitle.includes('〔状態')
                  ? jaTitle.match(/〔状態([A-Z\-]+)〕/)?.[1] || ''
                  : '',
                description: '',
                url: `https://www.cardrush-pokemon.jp/product-list?keyword=${encodeURIComponent(jaTitle)}`,
                imageUrl: '',
                status: STOCK_STATUS.AVAILABLE,
                itemCode: generateUniqueKey(),
                shopName: 'cardrush-pokemon',
                shopIconUrl: 'https://www.cardrush-pokemon.jp/favicon.ico',
              })
            }
          } catch (error) {
            console.error('Error parsing pattern match:', error)
          }
        })
      }
    } catch (regexError) {
      console.error('Error in pattern extraction:', regexError)
    }
  }

  console.log(`Final product count: ${products.length}`)
  return products
}

// 正規表現のエスケープヘルパー関数
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// テキスト正規化ヘルパー関数
function normalizeText(text: string): string {
  if (!text) return ''
  return text
    .replace(/\s+/g, ' ') // 複数の空白を1つにまとめる
    .replace(/\n+/g, ' ') // 改行を空白に置換
    .trim() // 前後の空白を削除
}

// アーカイブされたHTMLファイルからデータを解析する関数
async function analyzeArchivedHtml(promptUniqueKey: string): Promise<void> {
  try {
    console.log('Analyzing archived HTML files...')
    const debugDir = path.join(process.cwd(), 'debug')
    if (!fs.existsSync(debugDir)) {
      console.log('Debug directory not found')
      return
    }

    // HTMLファイルを検索
    const files = fs
      .readdirSync(debugDir)
      .filter((file) => file.startsWith('cardrush-pokemon-') && file.endsWith('.html'))

    if (files.length === 0) {
      console.log('No archived HTML files found')
      return
    }

    console.log(`Found ${files.length} HTML files for analysis`)

    for (const file of files) {
      const filePath = path.join(debugDir, file)
      const html = fs.readFileSync(filePath, 'utf-8')
      console.log(`Analyzing ${file}, size: ${html.length} bytes`)

      // HTMLをパースして商品を抽出
      const products = mapHtmlToProducts(html, false) // 全商品を抽出

      console.log(`Extracted ${products.length} products from ${file}`)
      saveDebugJSON(`${file.replace('.html', '-products.json')}`, products)

      // プロンプトに直接結果を追加
      let lockAcquired = false
      try {
        lockAcquired = promptProductSaver.acquireLock(promptUniqueKey)
        if (lockAcquired) {
          await promptProductSaver.saveProducts(
            promptUniqueKey,
            products,
            'cardrush-pokemon',
            false, // 最後のファイルではない場合はtrueに
          )
        }
      } finally {
        if (lockAcquired) {
          promptProductSaver.releaseLock(promptUniqueKey)
        }
      }
    }

    // すべてのファイルの処理が終わったら、最終的な結果として保存
    let finalLockAcquired = false
    try {
      finalLockAcquired = promptProductSaver.acquireLock(promptUniqueKey)
      if (finalLockAcquired) {
        // 最終的な結果を保存して完了としてマーク
        await promptProductSaver.markComplete(promptUniqueKey)
      }
    } finally {
      if (finalLockAcquired) {
        promptProductSaver.releaseLock(promptUniqueKey)
      }
    }

    console.log('Archived HTML analysis complete')
  } catch (error) {
    console.error('Error analyzing archived HTML:', error)
  }
}

// アーカイブ解析関数をエクスポート
export { analyzeArchivedHtml }

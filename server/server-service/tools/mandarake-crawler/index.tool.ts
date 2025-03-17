import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { Tool } from '@langchain/core/tools'
import * as cheerio from 'cheerio'
import { ProductItemEntity } from '@/domains/entities/product-item.entity'
import { mandarakeCrawlerPrompts } from './prompts'

export class MandarakeCrawlerTool extends Tool {
  private translator: BaseChatModel

  constructor(translator: BaseChatModel) {
    super()
    this.translator = translator
  }

  name = 'mandarake_crawler'
  description =
    'Search for rare items on Mandarake. 検索ワードは日本語のみのため、事前に日本語に翻訳して利用する必要がある。'

  async _call(prompt: string): Promise<string> {
    try {
      const items = await this.searchItems(this.translator, prompt)
      return JSON.stringify(items, null, 2) // LangChainのフォーマットに合わせstring型に変換
    } catch (error: unknown) {
      if (error instanceof Error) {
        return JSON.stringify({ error: 'Failed to search items', details: error.message })
      }
      return JSON.stringify({ error: 'Failed to search items', details: 'Unknown error occurred' })
    }
  }

  private async searchItems(llmModel: BaseChatModel, prompt: string): Promise<ProductItemEntity[]> {
    // 英語のキーワードと価格範囲を前処理
    prompt = await this.preprocessQuery(llmModel, prompt)

    // 通常の検索処理
    const url = await this.generateSearchUrl(llmModel, prompt)

    try {
      const content = await this.getHtmls(url)
      const items = await this.parseHtml(content)
      const filteredItems = items.filter((item): item is ProductItemEntity => item !== null)

      // 重複を排除
      const uniqueResults = this.removeDuplicatesByItemCode(filteredItems)

      return uniqueResults
    } catch (error: unknown) {
      if (error instanceof Error) throw error
      throw new Error('Unknown error occurred during crawling')
    }
  }

  // itemCodeをキーにして重複を排除するメソッド
  private removeDuplicatesByItemCode(items: ProductItemEntity[]): ProductItemEntity[] {
    const uniqueMap = new Map<string, ProductItemEntity>()

    for (const item of items) {
      // itemCodeがない場合はURLをキーとして使用
      const key = item.itemCode || item.url

      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, item)
      }
    }

    return Array.from(uniqueMap.values())
  }

  // 検索クエリの前処理（英語→日本語、ドル→円の変換）
  private async preprocessQuery(llmModel: BaseChatModel, prompt: string): Promise<string> {
    console.log('\n=== Query Preprocessing ===')
    console.log('🔍 Original query:', prompt)

    // ドル表記を直接検出して円に変換する簡易処理
    const dollarRangeRegex = /\$(\d+)(?:k)?-\$(\d+)(?:k)?/i
    const dollarSingleRegex = /\$(\d+)(?:k)?/g

    // ドル範囲の変換（例: $2000-$3000 → 300000円-450000円）
    if (dollarRangeRegex.test(prompt)) {
      const match = prompt.match(dollarRangeRegex)
      if (match) {
        let minValue = parseInt(match[1])
        let maxValue = parseInt(match[2])

        // kが付いている場合は1000倍
        if (match[0].toLowerCase().includes('k')) {
          if (match[0].toLowerCase().indexOf('k') < match[0].indexOf('-')) {
            minValue *= 1000
          }
          if (match[0].toLowerCase().lastIndexOf('k') > match[0].indexOf('-')) {
            maxValue *= 1000
          }
        }

        // 円に変換（$1 = ¥150）
        const minYen = minValue * 150
        const maxYen = maxValue * 150

        // クエリを置換
        const newPrompt = prompt.replace(dollarRangeRegex, `${minYen}円-${maxYen}円`)

        console.log(`💱 ドル価格範囲を検出: ${match[0]} → ${minYen}円-${maxYen}円`)
        prompt = newPrompt
      }
    }
    // 単一ドル価格の変換（例: $2000 → 300000円）
    else if (dollarSingleRegex.test(prompt)) {
      let newPrompt = prompt
      let match
      // 正規表現のインデックスをリセット
      dollarSingleRegex.lastIndex = 0

      // 複数のドル表記を全て変換
      while ((match = dollarSingleRegex.exec(prompt)) !== null) {
        let value = parseInt(match[1])

        // kが付いている場合は1000倍
        if (match[0].toLowerCase().includes('k')) {
          value *= 1000
        }

        // 円に変換（$1 = ¥150）
        const yen = value * 150

        // クエリを置換
        newPrompt = newPrompt.replace(match[0], `${yen}円`)
        console.log(`💱 単一ドル価格を検出: ${match[0]} → ${yen}円`)
      }

      prompt = newPrompt
    }

    try {
      // 英語のキーワードと価格範囲を処理するためのプロンプト
      const response = await llmModel.invoke([
        {
          role: 'system',
          content: `
あなたは検索クエリの前処理を行うエキスパートです。
以下の2つの処理を行ってください：

1. 英語のアニメ・マンガ名を日本語に変換
   - 例: "dragon ball" → "ドラゴンボール"
   - 例: "dragonball" → "ドラゴンボール"
   - 例: "one piece" → "ワンピース"
   - 例: "naruto" → "ナルト"

2. ドル価格を円価格に変換（レート: $1 = ¥150）
   - 例: "$100" → "15000円"
   - 例: "$100-$200" → "15000円-30000円"
   - 例: "$2000-$3000" → "300000円-450000円"
   - 例: "under $500" → "75000円以下"
   - 例: "over $1000" → "150000円以上"

入力クエリを分析し、日本語のキーワードと円価格に変換してください。
元のクエリの意味を保持しつつ、日本の通販サイトで使用できる形式に変換してください。

重要: 必ず数値を正確に変換してください。例えば$2000は必ず300000円に変換してください。
`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ])

      const processedQuery = String(response.content).trim()
      console.log('✅ Processed query:', processedQuery)
      console.log('=== End of Preprocessing ===\n')

      return processedQuery
    } catch (error) {
      console.error('❌ Error preprocessing query:', error)
      return prompt // エラーが発生した場合は元のクエリを返す
    }
  }

  private async optimizeSearchQuery(
    llmModel: BaseChatModel,
    prompt: string,
  ): Promise<{
    keywords: string
    categoryCode: string | null
    priceRange: { min: number | null; max: number | null }
    sortType: string | null
    sellType: string | null
    stockType: string | null
  }> {
    const systemPrompt = mandarakeCrawlerPrompts.optimizeSearchQuery
    const response = await llmModel.invoke([
      ['system', systemPrompt],
      ['human', prompt],
    ])

    try {
      const result = JSON.parse(response.content as string)

      // 価格範囲の直接検出（LLMの処理に加えて二重チェック）
      const priceRange = this.extractPriceRange(prompt, result.priceRange)

      return {
        keywords: result.keywords,
        categoryCode: result.categoryCode || null,
        priceRange: priceRange,
        sortType: result.sortType,
        sellType: result.sellType,
        stockType: result.stockType,
      }
    } catch (error) {
      console.error('Failed to parse optimization result:', error)

      // エラー時も価格範囲の直接検出を試みる
      const priceRange = this.extractPriceRange(prompt, { min: null, max: null })

      return {
        keywords: prompt,
        categoryCode: null,
        priceRange: priceRange,
        sortType: null,
        sellType: null,
        stockType: null,
      }
    }
  }

  // 価格範囲を直接テキストから抽出するヘルパーメソッド
  private extractPriceRange(
    text: string,
    defaultRange: { min: number | null; max: number | null },
  ): { min: number | null; max: number | null } {
    console.log('🔍 価格範囲を直接抽出中...')

    // 円表記の価格範囲を検出（例: 300000円-450000円）
    const yenRangeRegex = /(\d+)円\s*-\s*(\d+)円/
    const yenMatch = text.match(yenRangeRegex)
    if (yenMatch) {
      const min = parseInt(yenMatch[1])
      const max = parseInt(yenMatch[2])
      console.log(`💴 円価格範囲を検出: ${min}円-${max}円`)
      return { min, max }
    }

    // ドル表記の価格範囲を検出（例: $2000-$3000）
    const dollarRangeRegex = /\$(\d+)(?:k)?-\$(\d+)(?:k)?/i
    const dollarMatch = text.match(dollarRangeRegex)
    if (dollarMatch) {
      let min = parseInt(dollarMatch[1])
      let max = parseInt(dollarMatch[2])

      // kが付いている場合は1000倍
      if (dollarMatch[0].toLowerCase().includes('k')) {
        if (dollarMatch[0].toLowerCase().indexOf('k') < dollarMatch[0].indexOf('-')) {
          min *= 1000
        }
        if (dollarMatch[0].toLowerCase().lastIndexOf('k') > dollarMatch[0].indexOf('-')) {
          max *= 1000
        }
      }

      // 円に変換（$1 = ¥150）
      min = min * 150
      max = max * 150

      console.log(`💵 ドル価格範囲を検出: ${dollarMatch[0]} → ${min}円-${max}円`)
      return { min, max }
    }

    // 単一の円価格を検出（例: 10000円以上、10000円以下）
    const yenSingleRegex = /(\d+)円(以上|以下|まで)/
    const yenSingleMatch = text.match(yenSingleRegex)
    if (yenSingleMatch) {
      const value = parseInt(yenSingleMatch[1])
      const type = yenSingleMatch[2]

      if (type === '以上') {
        console.log(`💴 円価格下限を検出: ${value}円以上`)
        return { min: value, max: null }
      } else {
        console.log(`💴 円価格上限を検出: ${value}円${type}`)
        return { min: null, max: value }
      }
    }

    // 単一のドル価格を検出（例: $2000以上、under $3000）
    const dollarSingleRegex = /(?:over|\$)(\d+)(?:k)?|(?:under|below)\s*\$(\d+)(?:k)?/i
    const dollarSingleMatch = text.match(dollarSingleRegex)
    if (dollarSingleMatch) {
      // over $2000 または $2000 の形式
      if (dollarSingleMatch[1]) {
        let value = parseInt(dollarSingleMatch[1])
        if (dollarSingleMatch[0].toLowerCase().includes('k')) {
          value *= 1000
        }
        value = value * 150 // 円に変換
        console.log(`💵 ドル価格下限を検出: ${dollarSingleMatch[0]} → ${value}円以上`)
        return { min: value, max: null }
      }
      // under $3000 の形式
      else if (dollarSingleMatch[2]) {
        let value = parseInt(dollarSingleMatch[2])
        if (dollarSingleMatch[0].toLowerCase().includes('k')) {
          value *= 1000
        }
        value = value * 150 // 円に変換
        console.log(`💵 ドル価格上限を検出: ${dollarSingleMatch[0]} → ${value}円以下`)
        return { min: null, max: value }
      }
    }

    console.log('💲 価格範囲の直接検出に失敗、デフォルト値を使用します')
    return defaultRange
  }

  // マンダラケの商品ページのタイトルを英訳する
  private async translateTitle(jaTitle: string): Promise<string> {
    try {
      const response = await this.translator.invoke([
        {
          role: 'system',
          content: mandarakeCrawlerPrompts.translateTitleSystemPrompt,
        },
        {
          role: 'user',
          content: jaTitle,
        },
      ])

      return String(response.content) || jaTitle
    } catch (error) {
      console.error('Error translating title:', error)
      return jaTitle
    }
  }

  // マンダラケの商品ページのhtmlを取得する
  private async getHtmls(url: string): Promise<string> {
    // タイムアウトを設定
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    // リクエストを送信
    const response = await fetch(url, {
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
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    // レスポンス処理
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

    const content = new TextDecoder().decode(allChunks)

    return content
  }

  // マンダラケの商品ページのhtmlをパースする
  private async parseHtml(content: string): Promise<ProductItemEntity[]> {
    const $ = cheerio.load(content)
    const processedItems = await Promise.all(
      $('.block')
        .map(async (_, element) => {
          try {
            const jaTitle = $(element).find('.title').text().trim()
            const priceText = $(element).find('.price').text().trim()

            const basePrice = priceText.match(/^[\d,]+/)?.[0] || ''
            const taxIncludedPrice = priceText.match(/\(税込\s*([\d,]+)円\)/)?.[1] || ''

            const price = parseInt(basePrice.replace(/,/g, '')) || 0
            const priceWithTax = parseInt(taxIncludedPrice.replace(/,/g, '')) || 0

            if (!jaTitle || !price) {
              return null
            }

            const url = $(element).find('.title a').attr('href') || ''
            const imageUrl = $(element).find('.thum img').attr('src') || ''
            const status = $(element).find('.stock').text().trim()
            const shopInfo = $(element).find('.shop').text().trim()
            const itemCode = $(element).find('.itemno').text().trim()
            const priceRange = $(element).find('.price_range').text().trim()

            const enTitle = await this.translateTitle(jaTitle)

            return {
              title: {
                en: enTitle,
                ja: jaTitle,
              },
              price,
              priceWithTax,
              url: url.startsWith('http') ? url : `https://order.mandarake.co.jp${url}`,
              imageUrl: imageUrl.startsWith('http')
                ? imageUrl
                : `https://order.mandarake.co.jp${imageUrl}`,
              status,
              shopInfo,
              itemCode,
              priceRange,
              isNewArrival: $(element).find('.new_arrival').length > 0,
              shopName: 'mandarake',
              shopIconUrl: 'https://www.mandarake.co.jp/favicon.ico',
            }
          } catch (itemError) {
            console.error('Error parsing item data:', itemError)
            return null
          }
        })
        .get(),
    )

    const filteredItems = processedItems.filter((item): item is ProductItemEntity => item !== null)
    return filteredItems
  }

  private async generateSearchUrl(llmModel: BaseChatModel, prompt: string): Promise<string> {
    try {
      console.log('\n=== Mandarake URL Generator ===')
      console.log('🔍 Input prompt:', prompt)

      // 検索クエリの最適化
      const { keywords, categoryCode, priceRange, sortType, sellType, stockType } =
        await this.optimizeSearchQuery(llmModel, prompt)

      console.log('\n📝 Optimized Parameters:')
      console.log('- Keywords:', keywords)
      console.log('- Category Code:', categoryCode || 'None')
      console.log('- Price Range:', priceRange)
      console.log('- Sort Type:', sortType)
      console.log('- Sell Type:', sellType)
      console.log('- Stock Type:', stockType)

      const response = await llmModel.invoke([
        ['system', mandarakeCrawlerPrompts.generateSearchUrlSystemPrompt],
        [
          'human',
          mandarakeCrawlerPrompts.urlGeneration(
            keywords,
            categoryCode,
            priceRange,
            sortType,
            sellType,
            stockType,
          ),
        ],
      ])

      const url = (response.content as string).trim()

      console.log('\n🌐 Generated URL:')
      console.log('Encoded:')
      console.log(url)
      console.log('\nDecoded:')
      console.log(decodeURIComponent(url))

      // URLパラメータを解析して表示
      try {
        const urlObj = new URL(url)
        console.log('\n📊 URL Parameters:')
        for (const [key, value] of urlObj.searchParams.entries()) {
          console.log(`- ${key}: ${decodeURIComponent(value)}`)
        }
      } catch (error) {
        console.log('Failed to parse URL parameters')
      }

      console.log('\n=== End of URL Generation ===\n')

      return url
    } catch (error) {
      console.error('\n❌ Error generating URL:', error)
      const fallbackUrl = `https://order.mandarake.co.jp/order/listPage/list?keyword=${encodeURIComponent(
        prompt,
      )}`
      console.log('⚠️ Using fallback URL:', fallbackUrl)
      return fallbackUrl
    }
  }
}

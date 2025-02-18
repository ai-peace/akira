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
    const url = await this.generateSearchUrl(llmModel, prompt)

    try {
      const content = await this.getHtmls(url)
      const items = await this.parseHtml(content)
      const filteredItems = items.filter((item): item is ProductItemEntity => item !== null)
      return filteredItems
    } catch (error: unknown) {
      if (error instanceof Error) throw error
      throw new Error('Unknown error occurred during crawling')
    }
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
      const { keywords, categoryHints, priceRange, sortType, sellType, stockType } =
        await this.optimizeSearchQuery(llmModel, prompt)

      console.log('\n📝 Optimized Parameters:')
      console.log('- Keywords:', keywords)
      console.log('- Price Range:', priceRange)
      console.log('- Sort Type:', sortType)
      console.log('- Sell Type:', sellType)
      console.log('- Stock Type:', stockType)
      // ${categoryHints.length > 0 ? `- Category: categoryCode=${categoryHints[0]}` : ''}

      const response = await llmModel.invoke([
        ['system', mandarakeCrawlerPrompts.generateSearchUrlSystemPrompt],
        [
          'human',
          mandarakeCrawlerPrompts.urlGeneration(
            keywords,
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

  private async optimizeSearchQuery(
    llmModel: BaseChatModel,
    prompt: string,
  ): Promise<{
    keywords: string
    categoryHints: string[]
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
      return {
        keywords: result.keywords,
        categoryHints: result.categoryHints,
        priceRange: result.priceRange,
        sortType: result.sortType,
        sellType: result.sellType,
        stockType: result.stockType,
      }
    } catch (error) {
      console.error('Failed to parse optimization result:', error)
      return {
        keywords: prompt,
        categoryHints: [],
        priceRange: { min: null, max: null },
        sortType: null,
        sellType: null,
        stockType: null,
      }
    }
  }
}

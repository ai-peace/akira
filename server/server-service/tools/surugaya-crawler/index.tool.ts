import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { Tool } from '@langchain/core/tools'
import * as cheerio from 'cheerio'
import { ProductItemEntity } from '@/common/domains/entities/product-item.entity'
import { surugayaCrawlerPrompts } from './prompts'

export class SurugayaCrawlerTool extends Tool {
  private translator: BaseChatModel

  constructor(translator: BaseChatModel) {
    super()
    this.translator = translator
  }

  name = 'surugaya_crawler'
  description =
    'Search for rare items on Surugaya. 駿河屋のクローラー。検索ワードは日本語のみのため、事前に日本語に翻訳して利用する必要がある。'

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
          content: surugayaCrawlerPrompts.translateTitleSystemPrompt,
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
      $('#search_result .item')
        .map(async (_, element) => {
          try {
            // 商品タイトル
            const jaTitle = $(element).find('.title h3.product-name').text().trim()

            // 価格情報の取得
            const priceText = $(element).find('.price_teika').text().trim()
            let price = 0
            let priceWithTax = 0

            // 通常価格のパース
            const normalPriceMatch = priceText.match(/中古：￥([\d,]+)/)
            if (normalPriceMatch) {
              price = parseInt(normalPriceMatch[1].replace(/,/g, ''))
              priceWithTax = price // 駿河屋は税込表示
            }

            // 価格範囲がある場合
            const priceRangeMatch = priceText.match(/中古：￥([\d,]+)\s*～\s*￥([\d,]+)/)
            if (priceRangeMatch) {
              price = parseInt(priceRangeMatch[1].replace(/,/g, ''))
              const maxPrice = parseInt(priceRangeMatch[2].replace(/,/g, ''))
              priceWithTax = price
            }

            if (!jaTitle || !price) {
              return null
            }

            // 商品URL
            const url = $(element).find('.title a').attr('href') || ''
            const fullUrl = url.startsWith('http') ? url : `https://www.suruga-ya.jp${url}`

            // 商品画像URL
            const imageUrl = $(element).find('.thum img').attr('src') || ''
            const fullImageUrl = imageUrl.startsWith('http')
              ? imageUrl
              : `https://www.suruga-ya.jp${imageUrl}`

            // 商品状態
            const status = $(element).find('.price').text().includes('品切れ')
              ? '品切れ'
              : '在庫あり'

            // ブランド情報
            const brandMatch = $(element)
              .find('.brand')
              .text()
              .match(/\[(.*?)\]/)
            const shopInfo = brandMatch ? brandMatch[1].trim() : ''

            // 商品コード
            const itemCodeMatch = url.match(/detail\/(\d+)/)
            const itemCode = itemCodeMatch ? itemCodeMatch[1] : ''

            // 新着フラグ
            const isNewArrival = $(element).find('.new_arrival').length > 0

            // 英語タイトルの取得
            const enTitle = await this.translateTitle(jaTitle)

            // ProductItemEntityの型に合わせて返却
            return {
              title: {
                en: enTitle,
                ja: jaTitle,
              },
              price,
              priceWithTax,
              url: fullUrl,
              imageUrl: fullImageUrl,
              status,
              shopInfo,
              itemCode,
              isNewArrival,
              priceRange: '',
              shopName: 'surugaya(駿河屋)',
              shopIconUrl: 'https://www.suruga-ya.jp/drupal/themes/surugaya/favicon.ico',
            } satisfies ProductItemEntity
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
      console.log('\n=== Surugaya URL Generator ===')
      console.log('🔍 Input prompt:', prompt)

      // 検索クエリの最適化
      const {
        keywords,
        category,
        price,
        inStock,
        release_year,
        saleClassified,
        rankBy,
        brand,
        hendou,
      } = await this.optimizeSearchQuery(llmModel, prompt)

      console.log('\n📝 Optimized Parameters:')
      console.log('- Keywords:', keywords)
      console.log('- Category:', category)
      console.log('- Price:', price)
      console.log('- In Stock:', inStock)
      console.log('- Release Year:', release_year)
      console.log('- Sale Classified:', saleClassified)
      console.log('- Rank By:', rankBy)
      console.log('- Brand:', brand)
      console.log('- Hendou:', hendou)

      const response = await llmModel.invoke([
        ['system', surugayaCrawlerPrompts.generateSearchUrlSystemPrompt],
        [
          'human',
          surugayaCrawlerPrompts.urlGeneration(
            keywords,
            category,
            price,
            inStock,
            release_year,
            saleClassified,
            rankBy,
            brand,
            hendou,
          ),
        ],
      ])

      const url = (response.content as string).trim()

      // URLの基本検証
      if (!url.startsWith('https://www.suruga-ya.jp/search')) {
        throw new Error('Invalid URL generated')
      }

      console.log('\n🌐 Generated URL:')
      console.log('Encoded:', url)
      console.log('\nDecoded:', decodeURIComponent(url))

      return url
    } catch (error) {
      console.error('\n❌ Error generating URL:', error)
      // フォールバックURL - 基本的な検索のみ
      const fallbackUrl = `https://www.suruga-ya.jp/search?search_word=${encodeURIComponent(
        prompt,
      )}&rankBy=price:descending`
      console.log('⚠️ Using fallback URL:', fallbackUrl)
      return fallbackUrl
    }
  }

  private async optimizeSearchQuery(
    llmModel: BaseChatModel,
    prompt: string,
  ): Promise<{
    keywords: string | null
    category: number[] | null
    price: { min: number | null; max: number | null } | null
    inStock: boolean | null
    release_year: number | null
    saleClassified: 'new' | 'used' | 'reserve' | null
    rankBy: string | null
    brand: string | null
    hendou: string | null
  }> {
    const systemPrompt = surugayaCrawlerPrompts.optimizeSearchQuery
    const response = await llmModel.invoke([
      ['system', systemPrompt],
      ['human', prompt],
    ])

    try {
      const result = JSON.parse(response.content as string)
      return {
        keywords: result.keywords ?? null,
        category: result.category ?? null,
        price: result.price ?? null,
        inStock: result.inStock ?? null,
        release_year: result.release_year ?? null,
        saleClassified: result.saleClassified ?? null,
        rankBy: result.rankBy ?? null,
        brand: result.brand ?? null,
        hendou: result.hendou ?? null,
      }
    } catch (error) {
      console.error('Failed to parse optimization result:', error)
      return {
        keywords: prompt,
        category: null,
        price: null,
        inStock: null,
        release_year: null,
        saleClassified: null,
        rankBy: null,
        brand: null,
        hendou: null,
      }
    }
  }
}

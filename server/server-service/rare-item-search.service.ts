import { ChatOpenAI } from '@langchain/openai'
import { MandarakeCrawlerTool } from './mandarake-crawler.service'
import { ExtractKeywordsTool } from './extract-keywords.service'
import { ProductEntity } from '@/domains/entities/product.entity'
import { prisma } from '../server-lib/prisma'
import { generateUniqueKey } from '../server-lib/uuid'
import { MandarakeUrlGeneratorService } from './mandarake-url-generator.service'

type KeywordPair = {
  en: string
  ja: string
}

export class RareItemSearchService {
  private mandarakeCrawler: MandarakeCrawlerTool | null = null
  private extractKeywordsTool: ExtractKeywordsTool | null = null
  private translator: ChatOpenAI | null = null
  private urlGenerator: MandarakeUrlGeneratorService | null = null

  static async create(openAIApiKey: string): Promise<RareItemSearchService> {
    const service = new RareItemSearchService()
    await service.initialize(openAIApiKey)
    return service
  }

  private async initialize(openAIApiKey: string): Promise<void> {
    this.mandarakeCrawler = new MandarakeCrawlerTool(openAIApiKey)
    this.extractKeywordsTool = new ExtractKeywordsTool(openAIApiKey)
    this.translator = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
      openAIApiKey,
    })
    this.urlGenerator = new MandarakeUrlGeneratorService(openAIApiKey)
  }

  private async translateToJapanese(text: string): Promise<string> {
    if (!this.translator) throw new Error('Translator not initialized')

    // 既に日本語の場合はそのまま返す
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
      return text
    }

    const response = await this.translator.invoke([
      [
        'system',
        'You are a translator. Translate the following text to Japanese, keeping product names in their original form.',
      ],
      ['human', text],
    ])

    return response.content as string
  }

  async searchItems(keyword: string, promptUniqueKey: string): Promise<ProductEntity[]> {
    if (!this.mandarakeCrawler || !this.urlGenerator) throw new Error('Service not initialized')
    if (!promptUniqueKey) throw new Error('promptUniqueKey is required')

    try {
      // キーワードを日本語に翻訳
      const japaneseKeyword = await this.translateToJapanese(keyword)

      // 検索URLを生成
      const searchUrl = await this.urlGenerator.generateSearchUrl(japaneseKeyword)

      // クローラーを直接呼び出し
      const result = await this.mandarakeCrawler._call(searchUrl)

      // 結果のパース
      let items: any[] = []
      try {
        const parsed = JSON.parse(result)
        items = Array.isArray(parsed) ? parsed : parsed.items || []
      } catch (parseError) {
        console.error('Failed to parse crawler result:', parseError)
        await this.updatePromptWithError(promptUniqueKey, 'Failed to parse crawler result')
        return []
      }

      // 結果を変換
      const transformedItems = items.map((item: any) => {
        return {
          title: item.title,
          price: item.price,
          priceWithTax: item.priceWithTax,
          currency: item.currency,
          condition: item.status || 'Unknown',
          description: `Available at: ${item.shopInfo}${item.priceRange ? ` ${item.priceRange}` : ''}`,
          imageUrl: item.imageUrl,
          url: item.url,
          status: item.status || 'Unknown',
          itemCode: item.itemCode || item.url.split('itemCode=')[1]?.split('&')[0] || 'Unknown',
        }
      })

      // プロンプトを更新
      await prisma.prompt.update({
        where: {
          uniqueKey: promptUniqueKey,
        },
        data: {
          result: {
            message: `Found ${transformedItems.length} items matching your search.`,
            data: transformedItems,
            keywords: [],
          },
          llmStatus: 'SUCCESS',
          resultType: transformedItems.length > 0 ? 'FOUND_PRODUCT_ITEMS' : 'NO_PRODUCT_ITEMS',
        },
      })

      // 非同期でキーワード抽出を開始
      this.extractAndUpdateKeywords(transformedItems, promptUniqueKey).catch((error) => {
        console.error('Failed to extract keywords:', error)
      })

      return transformedItems
    } catch (error) {
      console.error('Failed to fetch items:', error)
      await this.updatePromptWithError(promptUniqueKey, 'Failed to fetch items from Mandarake')
      throw new Error('Failed to fetch items from Mandarake')
    }
  }

  private async updatePromptWithError(
    promptUniqueKey: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      await prisma.prompt.update({
        where: {
          uniqueKey: promptUniqueKey,
        },
        data: {
          result: { message: errorMessage },
          llmStatus: 'FAILED',
          resultType: 'ERROR',
        },
      })
    } catch (error) {
      console.error('Failed to update prompt with error:', error)
    }
  }

  private async extractAndUpdateKeywords(
    items: ProductEntity[],
    promptUniqueKey: string,
  ): Promise<void> {
    if (!this.extractKeywordsTool) {
      throw new Error('Service not initialized')
    }

    try {
      const keywords = await this.extractKeywords(items)

      const currentPrompt = await prisma.prompt.findUnique({
        where: { uniqueKey: promptUniqueKey },
        select: { result: true },
      })

      const updatedResult = {
        message: `Found ${items.length} items matching your search.`,
        data: items,
        keywords: keywords,
        ...(currentPrompt?.result && typeof currentPrompt.result === 'object'
          ? currentPrompt.result
          : {}),
      }

      await prisma.prompt.update({
        where: { uniqueKey: promptUniqueKey },
        data: {
          result: updatedResult,
        },
      })
    } catch (error) {
      console.error('Failed to extract and update keywords:', error)
      // キーワード抽出に失敗しても、他のデータは保持する
      const updatedResult = {
        message: `Found ${items.length} items matching your search.`,
        data: items,
        keywords: [],
      }

      await prisma.prompt.update({
        where: { uniqueKey: promptUniqueKey },
        data: {
          result: updatedResult,
        },
      })
    }
  }

  async extractKeywords(items: ProductEntity[]): Promise<KeywordPair[]> {
    if (!this.extractKeywordsTool) {
      throw new Error('Service not initialized')
    }

    try {
      const japaneseItems = items.map((item) => item.title.ja).join('\n')

      const result = await this.extractKeywordsTool.invoke(japaneseItems)

      try {
        // 文字列が有効なJSONかどうかを確認
        if (typeof result !== 'string' || !result.trim().startsWith('[')) {
          console.error('Invalid JSON response:', result)
          return []
        }

        const parsedResult = JSON.parse(result)

        // 配列であることを確認し、各要素がKeywordPairの形式に従っているか検証
        if (!Array.isArray(parsedResult)) {
          console.error('Response is not an array:', parsedResult)
          return []
        }

        const validKeywords = parsedResult.filter((item): item is KeywordPair => {
          return (
            item &&
            typeof item === 'object' &&
            'en' in item &&
            'ja' in item &&
            typeof item.en === 'string' &&
            typeof item.ja === 'string'
          )
        })

        return validKeywords
      } catch (parseError) {
        console.error('Failed to parse keywords response:', result)
        console.error('Parse error:', parseError)
        return []
      }
    } catch (error) {
      console.error('Failed to extract keywords:', error)
      return []
    }
  }
}

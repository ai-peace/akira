import { ProductEntity } from '@/domains/entities/product.entity'
import { ChatOpenAI } from '@langchain/openai'
import { prisma } from '../server-lib/prisma'
import { ExtractKeywordsTool } from './extract-keywords.service'
import { MandarakeCrawlerTool } from './mandarake-crawler.service'
import { MandarakeUrlGeneratorService } from './mandarake-url-generator.service'
import { extractAndUpdateKeywordsService } from './refactor/extract-and-update-keywords.service'
import { translateToJpService } from './refactor/translate-to-jp.service'

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

  async searchItems(keyword: string, promptUniqueKey: string): Promise<ProductEntity[]> {
    if (!this.mandarakeCrawler || !this.urlGenerator) throw new Error('Service not initialized')
    if (!promptUniqueKey) throw new Error('promptUniqueKey is required')

    try {
      // キーワードを日本語に翻訳
      if (!this.translator) throw new Error('Translator not initialized')
      const japaneseKeyword = await translateToJpService(keyword, this.translator)

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
      if (!this.extractKeywordsTool) throw new Error('ExtractKeywordsTool not initialized')
      extractAndUpdateKeywordsService(
        transformedItems,
        promptUniqueKey,
        this.extractKeywordsTool,
        prisma,
      ).catch((error) => {
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
}

import { ProductEntity } from '@/domains/entities/product.entity'
import { prisma } from '../server-lib/prisma'
import { NewMandarakeCrawlerTool } from '../server-service/refactor/new-mandarake-crawler.service'
import { translateToJpService } from '../server-service/refactor/translate-to-jp.service'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { extractAndUpdateKeywordsService } from '../server-service/refactor/extract-and-update-keywords.service'

export class SearchProductItemUsecase {
  private promptUniqueKey: string
  private llmModel: BaseChatModel
  private searchService: NewMandarakeCrawlerTool

  constructor(
    promptUniqueKey: string,
    llmModel: BaseChatModel,
    searchService: NewMandarakeCrawlerTool,
  ) {
    this.promptUniqueKey = promptUniqueKey
    this.llmModel = llmModel
    this.searchService = searchService
  }

  async execute(keyword: string, promptUniqueKey: string) {
    // 1. キーワードを日本語に変換する
    const japaneseKeyword = await translateToJpService(keyword, this.llmModel)

    // 2. 検索サービスを実行する
    const searchResults = await this.searchService._call(japaneseKeyword)

    // 3. 検索結果をパースする
    const productEntities = await this.parseResult(searchResults)

    // 4. 検索結果を元にプロンプトを更新する
    await prisma.prompt.update({
      where: {
        uniqueKey: promptUniqueKey,
      },
      data: {
        result: {
          message: `Found ${productEntities.length} items matching your search.`,
          data: productEntities,
          keywords: [],
        },
        llmStatus: 'SUCCESS',
        resultType: productEntities.length > 0 ? 'FOUND_PRODUCT_ITEMS' : 'NO_PRODUCT_ITEMS',
      },
    })

    // 5. キーワードを抽出する
    extractAndUpdateKeywordsService(promptUniqueKey, productEntities, this.llmModel).catch(
      (error) => {
        console.error('Failed to extract keywords:', error)
      },
    )
  }

  private async parseResult(result: any): Promise<ProductEntity[]> {
    let items: any[] = []
    try {
      const parsed = JSON.parse(result)
      items = Array.isArray(parsed) ? parsed : parsed.items || []

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

      return transformedItems
    } catch (parseError) {
      console.error('Failed to parse crawler result:', parseError)
      await this.updatePromptWithError(this.promptUniqueKey, 'Failed to parse crawler result')
      return []
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

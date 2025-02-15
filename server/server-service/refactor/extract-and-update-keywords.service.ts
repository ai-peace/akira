import { ProductEntity } from '@/domains/entities/product.entity'
import { prisma } from '@/server/server-lib/prisma'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ExtractKeywordsTool } from '../extract-keywords.service'

export const extractAndUpdateKeywordsService = async (
  promptUniqueKey: string,
  productEntities: ProductEntity[],
  llmModel: BaseChatModel,
): Promise<void> => {
  try {
    const extractKeywordsTool = new ExtractKeywordsTool(llmModel)

    const japaneseItems = productEntities.map((item) => item.title.ja).join('\n')
    const keywords = await extractKeywordsTool.invoke(japaneseItems)

    const updatedResult = {
      message: `Found ${productEntities.length} items matching your search.`,
      data: productEntities,
      keywords: JSON.parse(keywords),
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
      message: `Found ${productEntities.length} items matching your search.`,
      data: productEntities,
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

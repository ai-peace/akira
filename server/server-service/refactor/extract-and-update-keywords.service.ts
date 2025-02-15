import { ProductEntity } from '@/domains/entities/product.entity'
import { PrismaClient } from '@prisma/client'
import { ExtractKeywordsTool } from '../extract-keywords.service'

export const extractAndUpdateKeywordsService = async (
  items: ProductEntity[],
  promptUniqueKey: string,
  extractKeywordsTool: ExtractKeywordsTool,
  prisma: PrismaClient,
): Promise<void> => {
  if (!extractKeywordsTool) {
    throw new Error('Service not initialized')
  }

  try {
    const japaneseItems = items.map((item) => item.title.ja).join('\n')
    const keywords = await extractKeywordsTool.invoke(japaneseItems)

    const updatedResult = {
      message: `Found ${items.length} items matching your search.`,
      data: items,
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

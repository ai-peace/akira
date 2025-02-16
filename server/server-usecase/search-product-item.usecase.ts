import { ProductEntity } from '@/domains/entities/product.entity'
import { ChatOpenAI } from '@langchain/openai'
import { applicationServerConst } from '../server-const/appilication.server-const'
import { prisma } from '../server-lib/prisma'
import { extractAndUpdateKeywordsService } from '../server-service/extract-and-update-keywords.service'
import { MandarakeCrawlerTool } from '../server-service/tools/mandarake-crawler.tool'
import { translateToJpService } from '../server-service/translate-to-jp.service'

const execute = async (promptUniqueKey: string, query: string) => {
  // キーワードを日本語に変換
  const translatorModel = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0,
    openAIApiKey: applicationServerConst.openai.apiKey,
  })
  const translatedKeyword = await translateToJpService(query, translatorModel)

  // クローラーの設定
  const crawlerModel = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    openAIApiKey: applicationServerConst.openai.apiKey,
  })
  const crawlerTool = new MandarakeCrawlerTool(crawlerModel)
  const result = await crawlerTool._call(translatedKeyword)

  const productEntities = await parseResult(promptUniqueKey, result)
  await savePromptAsSuccess(promptUniqueKey, productEntities)

  // キーワードを抽出する
  const extractorModel = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0,
    openAIApiKey: applicationServerConst.openai.apiKey,
  })
  extractAndUpdateKeywordsService(promptUniqueKey, productEntities, extractorModel).catch(
    (error) => {
      console.error('Failed to extract keywords:', error)
    },
  )
}

export const searchProductItemUsecase = { execute }

// private

const parseResult = async (promptUniqueKey: string, result: any): Promise<ProductEntity[]> => {
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
    await updatePromptWithError(promptUniqueKey, 'Failed to parse crawler result')
    return []
  }
}

const savePromptAsSuccess = async (promptUniqueKey: string, productEntities: ProductEntity[]) => {
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
}

const updatePromptWithError = async (
  promptUniqueKey: string,
  errorMessage: string,
): Promise<void> => {
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

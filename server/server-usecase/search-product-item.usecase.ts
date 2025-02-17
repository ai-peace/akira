import { ProductEntity } from '@/domains/entities/product.entity'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatOpenAI } from '@langchain/openai'
import { applicationServerConst } from '../server-const/appilication.server-const'
import { prisma } from '../server-lib/prisma'
import { ExtractKeywordsTool } from '../server-service/tools/extract-keywords/index.tool'
import { MandarakeCrawlerTool } from '../server-service/tools/mandarake-crawler/index.tool'
import { TranslateToJapaneseTool } from '../server-service/tools/translate-to-japanese/index.tool'

const execute = async (promptUniqueKey: string, query: string) => {
  // キーワードを日本語に変換
  const translatorModel = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0,
    openAIApiKey: applicationServerConst.openai.apiKey,
  })
  // const translatorModel = new GeminiChatModel({
  //   apiKey: applicationServerConst.gemini.apiKey,
  //   modelName: 'gemini-2.0-flash',
  // })
  const translateToJapaneseTool = new TranslateToJapaneseTool(translatorModel)
  const translatedKeyword = await translateToJapaneseTool.invoke(query)

  // クローラーの設定
  const crawlerModel = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    openAIApiKey: applicationServerConst.openai.apiKey,
  })
  // const crawlerModel = new GeminiChatModel({
  //   apiKey: applicationServerConst.gemini.apiKey,
  //   modelName: 'gemini-1.5-flash',
  //   temperature: 0,
  // })
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
  // const crawlerModel
  extractAndUpdateKeywords(promptUniqueKey, productEntities, extractorModel).catch((error) => {
    console.error('Failed to extract keywords:', error)
  })
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

const extractAndUpdateKeywords = async (
  promptUniqueKey: string,
  productEntities: ProductEntity[],
  llmModel: BaseChatModel,
): Promise<void> => {
  try {
    const extractKeywordsTool = new ExtractKeywordsTool(llmModel)

    const japaneseItems = productEntities.map((item) => item.title.ja).join('\n')
    const keywords = await extractKeywordsTool.invoke(japaneseItems)
    console.log('keywords???????-1---------------', keywords)
    const cleanText = keywords.replace(/^```json\n|\n```$/g, '')
    const parsedKeywords = JSON.parse(cleanText)
    console.log('parsedKeywords???????-2---------------', parsedKeywords)
    const updatedResult = {
      message: `Found ${productEntities.length} items matching your search.`,
      data: productEntities,
      keywords: parsedKeywords,
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

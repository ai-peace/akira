import { ProductEntity } from '@/domains/entities/product.entity'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatOpenAI } from '@langchain/openai'
import { applicationServerConst } from '../server-const/appilication.server-const'
import { prisma } from '../server-lib/prisma'
import { ExtractKeywordsTool } from '../server-service/tools/extract-keywords/index.tool'
import { MandarakeCrawlerTool } from '../server-service/tools/mandarake-crawler/index.tool'
import { TranslateToJapaneseTool } from '../server-service/tools/translate-to-japanese/index.tool'
import { SurugayaCrawlerTool } from '../server-service/tools/surugaya-crawler/index.tool'
import { logLLMCost } from '../server-lib/llm-cost-logger'

const execute = async (promptUniqueKey: string, query: string) => {
  // キーワードを日本語に変換
  const translatorModel = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    openAIApiKey: applicationServerConst.openai.apiKey,
    callbacks: [
      {
        handleLLMEnd: (output) => {
          logLLMCost(
            'gpt-4o-mini',
            output.llmOutput?.tokenUsage?.promptTokens || 0,
            output.llmOutput?.tokenUsage?.completionTokens || 0,
            'Japanese Translator',
          )
        },
      },
    ],
  })
  const translateToJapaneseTool = new TranslateToJapaneseTool(translatorModel)
  const translatedKeyword = await translateToJapaneseTool.invoke(query)

  // クローラーの設定
  const crawlerModel = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    openAIApiKey: applicationServerConst.openai.apiKey,
    callbacks: [
      {
        handleLLMEnd: (output) => {
          logLLMCost(
            'gpt-4o-mini',
            output.llmOutput?.tokenUsage?.promptTokens || 0,
            output.llmOutput?.tokenUsage?.completionTokens || 0,
            'Product Crawler',
          )
        },
      },
    ],
  })

  const crawlerTool1 = new MandarakeCrawlerTool(crawlerModel)
  const crawlerTool2 = new SurugayaCrawlerTool(crawlerModel)

  let accumulatedProducts: ProductEntity[] = []

  // 並列実行の設定
  const crawlerPromises = [
    {
      name: 'Mandarake',
      promise: crawlerTool1
        ._call(translatedKeyword)
        .then((result) => parseResult(promptUniqueKey, result)),
    },
    {
      name: 'Surugaya',
      promise: crawlerTool2
        ._call(translatedKeyword)
        .then((result) => parseResult(promptUniqueKey, result)),
    },
  ]

  // 各クローラーの結果を監視
  for (const { promise } of crawlerPromises) {
    try {
      const products = await promise
      accumulatedProducts = [...accumulatedProducts, ...products].sort((a, b) => b.price - a.price)

      // 結果が得られるたびに保存と更新
      await savePromptAsSuccess(promptUniqueKey, accumulatedProducts)

      // キーワード抽出は最新の結果セットに対して実行
      const extractorModel = new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        temperature: 0,
        openAIApiKey: applicationServerConst.openai.apiKey,
        callbacks: [
          {
            handleLLMEnd: (output) => {
              logLLMCost(
                'gpt-4o-mini',
                output.llmOutput?.tokenUsage?.promptTokens || 0,
                output.llmOutput?.tokenUsage?.completionTokens || 0,
                'Keyword Extractor',
              )
            },
          },
        ],
      })
      extractAndUpdateKeywords(promptUniqueKey, accumulatedProducts, extractorModel).catch(
        (error) => {
          console.error('Failed to extract keywords:', error)
        },
      )
    } catch (error) {
      console.error(`Crawler error:`, error)
    }
  }

  // 最終的な結果がない場合のフォールバック
  if (accumulatedProducts.length === 0) {
    await savePromptAsSuccess(promptUniqueKey, [])
  }
}

// 結果保存時のメッセージを動的に生成
const getResultMessage = (products: ProductEntity[], isPartial: boolean = false) => {
  if (products.length === 0) {
    return 'No items found matching your search.'
  }
  return `Found ${products.length} items${isPartial ? ' so far' : ''} matching your search.`
}

const savePromptAsSuccess = async (promptUniqueKey: string, productEntities: ProductEntity[]) => {
  const isPartial = productEntities.length > 0 // 部分的な結果かどうか
  await prisma.prompt.update({
    where: {
      uniqueKey: promptUniqueKey,
    },
    data: {
      result: {
        message: getResultMessage(productEntities, isPartial),
        data: productEntities,
        keywords: [],
      },
      llmStatus: 'SUCCESS',
      resultType: productEntities.length > 0 ? 'FOUND_PRODUCT_ITEMS' : 'NO_PRODUCT_ITEMS',
    },
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
        shopName: item.shopName,
        shopIconUrl: item.shopIconUrl,
      }
    })

    return transformedItems
  } catch (parseError) {
    console.error('Failed to parse crawler result:', parseError)
    await updatePromptWithError(promptUniqueKey, 'Failed to parse crawler result')
    return []
  }
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

    const cleanText = keywords.replace(/^```json\n|\n```$/g, '')
    const parsedKeywords = JSON.parse(cleanText)

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

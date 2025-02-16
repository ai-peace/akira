import { PromptGroupEntity } from '@/domains/entities/prompt-group.entity'
import { ChatOpenAI } from '@langchain/openai'
import { applicationServerConst } from '../server-const/appilication.server-const'
import { prisma } from '../server-lib/prisma'
import { generateUniqueKey } from '../server-lib/uuid'
import { promptGroupMapper } from '../server-mappers/prompt-group/index.mapper'
import { SearchProductItemUsecase } from '../server-usecase/search-product-item.usecase'
import { extractAndUpdateKeywordsService } from './extract-and-update-keywords.service'
import { MandarakeCrawlerTool } from './tools/mandarake-crawler.tool'
import { translateToJpService } from './translate-to-jp.service'
import { ProductEntity } from '@/domains/entities/product.entity'
import { initializeAgentExecutorWithOptions } from 'langchain/agents'
import { TranslateToJapaneseTool } from './tools/translate-to-japanese.tool'

type LlmStatus = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
const LlmStatus = {
  PROCESSING: 'PROCESSING' as const,
  SUCCESS: 'SUCCESS' as const,
} as const

const execute = async (chatUniqueKey: string, question: string): Promise<PromptGroupEntity> => {
  try {
    const promptGroup = await prisma.promptGroup.create({
      data: {
        chat: {
          connect: {
            uniqueKey: chatUniqueKey,
          },
        },
        uniqueKey: generateUniqueKey(),
        question,
        prompts: {
          createMany: {
            data: [
              {
                uniqueKey: generateUniqueKey(),
                llmStatus: LlmStatus.PROCESSING,
                resultType: 'FIRST_RESPONSE',
                order: 1,
              },
              {
                uniqueKey: generateUniqueKey(),
                llmStatus: LlmStatus.PROCESSING,
                resultType: 'RARE_ITEM_SEARCH',
                order: 2,
              },
            ],
          },
        },
      },
      include: {
        prompts: true,
      },
    })

    const searchablePrompt = promptGroup.prompts.find(
      (p: { resultType: string | null }) => p.resultType === 'RARE_ITEM_SEARCH',
    )
    const firstResponsePrompt = promptGroup.prompts.find(
      (p: { resultType: string | null }) => p.resultType === 'FIRST_RESPONSE',
    )

    if (!searchablePrompt || !firstResponsePrompt) throw new Error('Prompt not found')

    // 非同期に実行
    generateFirstResponse(firstResponsePrompt.uniqueKey, `Searching for ${question}...`)
    askRareItemSearch(searchablePrompt.uniqueKey, question)

    const promptGroupEntity = promptGroupMapper.toDomain(promptGroup)

    return promptGroupEntity
  } catch (error) {
    console.error('Error creating prompt group:', error)
    throw new Error('Failed to create prompt group')
  }
}

export const executeAgentService = { execute }

// private

const generateFirstResponse = async (promptUniqueKey: string, message: string) => {
  await prisma.prompt.update({
    where: {
      uniqueKey: promptUniqueKey,
    },
    data: {
      result: { message: message },
      llmStatus: LlmStatus.SUCCESS,
      resultType: 'FIRST_RESPONSE',
    },
  })
}

const askRareItemSearch = async (promptUniqueKey: string, keyword: string) => {
  // tools-------------------------------------------------------
  // キーワードを日本語に変換
  const translatorModel = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0,
    openAIApiKey: applicationServerConst.openai.apiKey,
  })
  const translateTool = new TranslateToJapaneseTool(translatorModel)
  const translatedKeyword = await translateToJpService(keyword, translatorModel)

  // クローラーの設定
  const crawlerModel = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    openAIApiKey: applicationServerConst.openai.apiKey,
  })
  const crawlerTool = new MandarakeCrawlerTool(crawlerModel)
  // const result = await crawlerTool._call(translatedKeyword)

  const agentExecutor = await initializeAgentExecutorWithOptions(
    [translateTool, crawlerTool],
    crawlerModel,
    {
      agentType: 'zero-shot-react-description',
    },
  )

  const result = await agentExecutor.invoke({
    input: keyword,
  })

  console.log('-------------------', result)

  const productEntities = await parseResult(promptUniqueKey, result.output)
  await savePromptAsSuccess(promptUniqueKey, productEntities)

  // ここまでがtools-------------------------------------------------------

  // キーワードを抽出する　？これってここの責務？
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

// 検索結果を元にプロンプトを更新する
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

// 検索結果をパースする
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

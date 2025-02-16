import { PromptGroupEntity } from '@/domains/entities/prompt-group.entity'
import { prisma } from '../server-lib/prisma'
import { generateUniqueKey } from '../server-lib/uuid'
import { promptGroupMapper } from '../server-mappers/prompt-group/index.mapper'
import { searchProductItemUsecase } from '../server-usecase/search-product-item.usecase'

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
    searchProductItemUsecase.execute(searchablePrompt.uniqueKey, question)

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

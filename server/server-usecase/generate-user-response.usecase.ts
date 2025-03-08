import { PromptGroupEntity } from '@/domains/entities/prompt-group.entity'
import { prisma } from '../server-lib/prisma'
import { generateUniqueKey } from '../server-lib/uuid'
import { promptGroupMapper } from '../server-mappers/prompt-group/index.mapper'
import { conversationAgent } from '../server-service/tools/conversation-agent/index.tool'
import { UserPromptUsage } from '@prisma/client'
import { userPromptUsageService } from '../server-service/user-prompt-usage.service'

type LlmStatus = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
const LlmStatus = {
  PROCESSING: 'PROCESSING' as const,
  SUCCESS: 'SUCCESS' as const,
} as const

const execute = async (
  chatUniqueKey: string,
  question: string,
  userPromptUsage: UserPromptUsage,
): Promise<PromptGroupEntity> => {
  try {
    const promptGroup = await initializePromptGroup(chatUniqueKey, question)

    // 非同期で会話エージェントを実行
    processConversation(promptGroup.prompts[0].uniqueKey, question).then(() => {
      // 会話エージェントが成功したら、ユーザーのプロンプト使用回数をインクリメント
      userPromptUsageService.increment(userPromptUsage)
    })

    const promptGroupEntity = promptGroupMapper.toDomain(promptGroup)
    return promptGroupEntity
  } catch (error) {
    console.error('Error processing conversation:', error)
    throw new Error('Failed to process conversation')
  }
}

export const generateUserResponseUsecase = { execute }

// private
const initializePromptGroup = async (chatUniqueKey: string, question: string) => {
  return await prisma.promptGroup.create({
    data: {
      chat: {
        connect: {
          uniqueKey: chatUniqueKey,
        },
      },
      uniqueKey: generateUniqueKey(),
      question,
      prompts: {
        create: {
          uniqueKey: generateUniqueKey(),
          llmStatus: LlmStatus.PROCESSING,
          resultType: 'AGENT_RESPONSE',
          order: 1,
        },
      },
    },
    include: {
      prompts: true,
    },
  })
}

const processConversation = async (promptUniqueKey: string, question: string) => {
  try {
    await conversationAgent.processInput(promptUniqueKey, question)
  } catch (error) {
    console.error('Error processing conversation:', error)
    await prisma.prompt.update({
      where: {
        uniqueKey: promptUniqueKey,
      },
      data: {
        result: { message: 'エラーが発生しました。もう一度お試しください。' },
        llmStatus: 'FAILED',
      },
    })
  }
}

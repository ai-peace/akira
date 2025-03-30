import { PromptGroupEntity } from '@/common/domains/entities/prompt-group.entity'
import { UserPromptUsage } from '@prisma/client'
import { sourcingWorkflow } from '../mastra/workflows/sourcing.workflow'
import { prisma } from '../server-lib/prisma'
import { generateUniqueKey } from '../server-lib/uuid'
import { promptGroupMapper } from '../server-mappers/prompt-group/index.mapper'
import { userPromptUsageService } from '../server-service/user-prompt-usage.service'

const execute = async (
  chatUniqueKey: string,
  question: string,
  userPromptUsage: UserPromptUsage,
): Promise<PromptGroupEntity> => {
  try {
    const promptGroup = await initializePromptGroup(chatUniqueKey, question)

    // 非同期で実行
    processSourcing(promptGroup.prompts[0].uniqueKey, question).then(() => {
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

export const sourcingUsecase = { execute }

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
          llmStatus: 'PROCESSING',
          resultType: 'AGENT_RESPONSE',
          order: 1,
        },
      },
    },
    include: {
      prompts: true,
      chat: true,
    },
  })
}

const processSourcing = async (promptUniqueKey: string, question: string) => {
  try {
    console.log('searching....')
    const run = sourcingWorkflow.createRun()
    const workflowResult = await run.start({
      triggerData: {
        input: question,
        promptUniqueKey,
      },
    })

    console.log('Mandarake Workflow results:', workflowResult)
  } catch (workflowError) {
    console.error('Mandarake workflow error:', workflowError)
  }
}

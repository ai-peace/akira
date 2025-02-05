import { applicationServerConst } from '@/server/server-const/appilication.server-const'
import { prisma } from '@/server/server-lib/prisma'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { promptGroupMapper } from '@/server/server-mappers/prompt-group/index.mapper'
import { RareItemSearchService } from '@/server/server-service/rare-item-search.service'
import { zValidator } from '@hono/zod-validator'
import { LlmStatus } from '@prisma/client'
import { Hono } from 'hono'
import { createChatPromptGroupSchema } from './schema/create.schema'

export const createChatPromptGroup = new Hono()

const route = createChatPromptGroup.post(
  '/chats/:uniqueKey/prompt-groups',
  zValidator('json', createChatPromptGroupSchema),
  async (c) => {
    try {
      const uniqueKey = c.req.param('uniqueKey')
      const { mainPrompt } = c.req.valid('json')

      const promptGroup = await prisma.promptGroup.create({
        data: {
          uniqueKey: generateUniqueKey(),
          question: mainPrompt,
          chat: {
            connect: {
              uniqueKey: uniqueKey,
            },
          },
          prompts: {
            createMany: {
              data: [
                {
                  uniqueKey: generateUniqueKey(),
                  llmStatus: LlmStatus.PROCESSING,
                  resultType: 'FIRST_RESPONSE',
                },
                {
                  uniqueKey: generateUniqueKey(),
                  llmStatus: LlmStatus.PROCESSING,
                  resultType: 'RARE_ITEM_SEARCH',
                },
              ],
            },
          },
        },
        include: {
          prompts: true,
        },
      })

      const searchablePrompt = promptGroup.prompts.find((p) => p.resultType === 'RARE_ITEM_SEARCH')
      const firstResponsePrompt = promptGroup.prompts.find((p) => p.resultType === 'FIRST_RESPONSE')

      if (!searchablePrompt || !firstResponsePrompt) throw new Error('Prompt not found')

      generateFirstResponse(firstResponsePrompt.uniqueKey, `${mainPrompt}を探しています`)
      askRareItemSearch(searchablePrompt.uniqueKey, mainPrompt)

      const promptGroupEntity = promptGroupMapper.toDomain(promptGroup)

      return c.json({ data: promptGroupEntity }, 201)
    } catch (error) {
      console.error('Error creating chat:', error)
      return c.json({ error: 'Failed to create chat' }, 500)
    }
  },
)

export type CreateChatPromptGroupRoute = typeof route

const generateFirstResponse = async (promptUniqueKey: string, result: string) => {
  await prisma.prompt.update({
    where: {
      uniqueKey: promptUniqueKey,
    },
    data: {
      result: result,
      llmStatus: LlmStatus.SUCCESS,
      resultType: 'FIRST_RESPONSE',
    },
  })
}

const askRareItemSearch = async (promptUniqueKey: string, keyword: string) => {
  const service = await RareItemSearchService.create(applicationServerConst.openai.apiKey)
  const result = await service.searchItems(keyword)

  await prisma.prompt.update({
    where: {
      uniqueKey: promptUniqueKey,
    },
    data: {
      result: result,
      llmStatus: LlmStatus.SUCCESS,
      resultType: 'RARE_ITEM_SEARCH',
    },
  })
}

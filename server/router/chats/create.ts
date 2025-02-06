import { applicationServerConst } from '@/server/server-const/appilication.server-const'
import { prisma } from '@/server/server-lib/prisma'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { chatMapper } from '@/server/server-mappers/chat/index.mapper'
import { RareItemSearchService } from '@/server/server-service/rare-item-search.service'
import { zValidator } from '@hono/zod-validator'
import { LlmStatus } from '@prisma/client'
import { Hono } from 'hono'
import { createChatSchema } from './schema/create.schema'

export const createChat = new Hono()

const route = createChat.post('/chats', zValidator('json', createChatSchema), async (c) => {
  try {
    const data = c.req.valid('json')

    const chat = await prisma.chat.create({
      data: {
        uniqueKey: generateUniqueKey(),
        promptGroups: {
          create: {
            uniqueKey: generateUniqueKey(),
            question: data.mainPrompt,
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
        },
      },
      include: {
        promptGroups: {
          include: {
            prompts: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    })

    const searchablePrompt = chat.promptGroups[0].prompts.find(
      (p) => p.resultType === 'RARE_ITEM_SEARCH',
    )

    const firstResponsePrompt = chat.promptGroups[0].prompts.find(
      (p) => p.resultType === 'FIRST_RESPONSE',
    )

    if (!searchablePrompt || !firstResponsePrompt) throw new Error('Prompt not found')

    generateFirstResponse(firstResponsePrompt.uniqueKey, `${data.mainPrompt}を探しています`)
    askRareItemSearch(searchablePrompt.uniqueKey, data.mainPrompt)

    const chatEntity = chatMapper.toDomain(chat)

    return c.json({ data: chatEntity }, 201)
  } catch (error) {
    console.error('Error creating chat:', error)
    return c.json({ error: 'Failed to create chat' }, 500)
  }
})

export type CreateChatRoute = typeof route

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

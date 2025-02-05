import { applicationServerConst } from '@/server/server-const/appilication.server-const'
import { prisma } from '@/server/server-lib/prisma'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import promptMapper from '@/server/server-mappers/prompt/index.mapper'
import { RareItemSearchService } from '@/server/server-service/rare-item-search.service'
import { zValidator } from '@hono/zod-validator'
import { LlmStatus } from '@prisma/client'
import { Hono } from 'hono'
import { createChatPromptSchema } from './schema/create.schema'

export const createChatPrompt = new Hono()

const route = createChatPrompt.post(
  '/chats/:uniqueKey/prompts',
  zValidator('json', createChatPromptSchema),
  async (c) => {
    try {
      const uniqueKey = c.req.param('uniqueKey')
      const { mainPrompt } = c.req.valid('json')

      const prompt = await prisma.prompt.create({
        data: {
          uniqueKey: generateUniqueKey('prompt_'),
          mainPrompt: mainPrompt,
          llmStatus: LlmStatus.PROCESSING,
          chat: {
            connect: {
              uniqueKey: uniqueKey,
            },
          },
        },
      })

      askRareItemSearch(prompt.uniqueKey, mainPrompt)

      const promptEntity = promptMapper.toDomain(prompt)

      return c.json({ data: promptEntity }, 201)
    } catch (error) {
      console.error('Error creating chat:', error)
      return c.json({ error: 'Failed to create chat' }, 500)
    }
  },
)

export type CreateChatPromptRoute = typeof route

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

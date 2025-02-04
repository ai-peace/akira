import { chatMapper } from '@/server/server-mappers/chat/index.mapper'
import { applicationServerConst } from '@/server/server-const/appilication.server-const'
import { prisma } from '@/server/server-lib/prisma'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { RareItemSearchService } from '@/server/server-service/rare-item-search.service'
import { zValidator } from '@hono/zod-validator'
import { LlmStatus } from '@prisma/client'
import { Hono } from 'hono'
import { createChatSchema } from './schema'

export const createChat = new Hono()

const route = createChat.post('/chats', zValidator('json', createChatSchema), async (c) => {
  try {
    const data = c.req.valid('json')

    const chat = await prisma.chat.create({
      data: {
        uniqueKey: generateUniqueKey('chat_'),
        prompts: {
          create: {
            uniqueKey: generateUniqueKey('prompt_'),
            mainPrompt: data.mainPrompt,
            llmStatus: LlmStatus.PROCESSING,
          },
        },
      },
    })

    // LLM処理を非同期に実施、追ってデータを更新する
    const service = await RareItemSearchService.create(applicationServerConst.openai.apiKey)
    service.searchItems(data.mainPrompt)

    const chatEntity = chatMapper.toDomain(chat)

    // 作成したデータで一旦返す
    return c.json({ data: chatEntity }, 201)
  } catch (error) {
    console.error('Error creating chat:', error)
    return c.json({ error: 'Failed to create chat' }, 500)
  }
})

export type CreateChatRoute = typeof route

import { prisma } from '@/server/server-lib/prisma'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { chatMapper } from '@/server/server-mappers/chat/index.mapper'
import { executeAgentService } from '@/server/server-service/execute-agent.service'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createChatSchema } from './schema/create.schema'

export const createChat = new Hono()

const route = createChat.post('/chats', zValidator('json', createChatSchema), async (c) => {
  try {
    const data = c.req.valid('json')

    const chat = await prisma.chat.create({
      data: {
        uniqueKey: generateUniqueKey(),
      },
      include: {
        promptGroups: {
          include: {
            prompts: true,
          },
        },
      },
    })

    await executeAgentService.execute(chat.uniqueKey, data.mainPrompt)

    const chatEntity = chatMapper.toDomain(chat)

    return c.json({ data: chatEntity }, 201)
  } catch (error) {
    console.error('Error creating chat:', error)
    return c.json({ error: 'Failed to create chat' }, 500)
  }
})

export type CreateChatRoute = typeof route

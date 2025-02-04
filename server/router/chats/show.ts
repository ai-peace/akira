import { prisma } from '@/server/server-lib/prisma'
import { chatMapper } from '@/server/server-mappers/chat/index.mapper'
import { Hono } from 'hono'

export const getChat = new Hono()

const route = getChat.get('/chats/:uniqueKey', async (c) => {
  try {
    const uniqueKey = c.req.param('uniqueKey')
    const chat = await prisma.chat.findUnique({
      where: {
        uniqueKey: uniqueKey,
      },
      include: {
        prompts: true,
      },
    })

    if (!chat) return c.json({ error: 'Chat not found' }, 404)

    const chatEntity = chatMapper.toDomain(chat)
    return c.json({ data: chatEntity })
  } catch (error) {
    console.error('Error fetching chat:', error)
    return c.json({ error: 'Failed to fetch chat' }, 500)
  }
})

export type GetChatRoute = typeof route

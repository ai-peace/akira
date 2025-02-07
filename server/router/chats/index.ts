import { prisma } from '@/server/server-lib/prisma'
import { chatMapper } from '@/server/server-mappers/chat/index.mapper'
import { Hono } from 'hono'

export const getChatCollection = new Hono()

const route = getChatCollection.get('/chats', async (c) => {
  try {
    const chats = await prisma.chat.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        promptGroups: true,
      },
    })

    const chatEntities = chatMapper.toDomainCollection(chats)

    return c.json({ data: chatEntities })
  } catch (error) {
    console.error('Error fetching chat collection:', error)
    return c.json({ error: 'Failed to fetch chat collection' }, 500)
  }
})

export type GetChatCollectionRoute = typeof route

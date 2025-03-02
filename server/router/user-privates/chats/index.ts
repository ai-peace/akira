import { prisma } from '@/server/server-lib/prisma'
import { chatMapper } from '@/server/server-mappers/chat/index.mapper'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { Hono } from 'hono'

export const getUserPrivateChatCollection = new Hono()

const route = getUserPrivateChatCollection.get(
  '/user-privates/chats',
  privyAuthMiddleware,
  requireUserMiddleware,
  async (c) => {
    try {
      const chats = await prisma.chat.findMany({
        where: {
          userId: c.var.user.id,
        },
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
  },
)

export type GetUserPrivateChatCollectionRoute = typeof route

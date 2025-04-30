import { ChatEntity } from '@/common/domains/entities/chat.entity'
import { createHcApiError, HcApiResponseType } from '@/common/domains/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { chatMapper } from '@/server/server-mappers/chat/index.mapper'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserPromptUsage } from '@/server/server-middleware/require-user-prompt-usage.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { Hono } from 'hono'

export const createVoiceChat = new Hono()

const route = createVoiceChat.post(
  '/voice-chats',
  privyAuthMiddleware,
  requireUserMiddleware,
  requireUserPromptUsage,
  async (c) => {
    try {
      const user = c.get('user')

      if (!user) {
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError('NOT_FOUND'),
          },
          404,
        )
      }

      const chat = await prisma.chat.create({
        data: {
          title: 'Voice Chat',
          uniqueKey: generateUniqueKey(),
          userId: user.id,
        },
        include: {
          promptGroups: {
            include: {
              prompts: true,
            },
          },
        },
      })

      const chatEntity = chatMapper.toDomain(chat)

      return c.json<HcApiResponseType<ChatEntity>>(
        {
          data: chatEntity,
        },
        201,
      )
    } catch (error) {
      console.error('Error creating chat:', error)

      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('SERVER_ERROR'),
        },
        500,
      )
    }
  },
)

export type CreateVoiceChatRoute = typeof route

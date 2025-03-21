import { ChatEntity } from '@/domains/entities/chat.entity'
import { createHcApiError, HcApiResponseType } from '@/domains/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { chatMapper } from '@/server/server-mappers/chat/index.mapper'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserPromptUsage } from '@/server/server-middleware/require-user-prompt-usage.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { generateUserResponseUsecase } from '@/server/server-usecase/generate-user-response.usecase'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createChatSchema } from './schema/create.schema'

export const createChat = new Hono()

const route = createChat.post(
  '/chats',
  privyAuthMiddleware,
  requireUserMiddleware,
  requireUserPromptUsage,
  zValidator('json', createChatSchema),
  async (c) => {
    try {
      const data = c.req.valid('json')
      const userPromptUsage = c.get('userPromptUsage')

      const user = await prisma.user.findUnique({
        where: {
          id: c.var.user.id,
        },
      })

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
          title: data.mainPrompt,
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

      await generateUserResponseUsecase.execute(chat.uniqueKey, data.mainPrompt, userPromptUsage)

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

export type CreateChatRoute = typeof route

import { PromptGroupEntity } from '@/domains/entities/prompt-group.entity'
import { createHcApiError, HcApiResponseType } from '@/domains/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserPromptUsage } from '@/server/server-middleware/require-user-prompt-usage.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { generateUserResponseUsecase } from '@/server/server-usecase/generate-user-response.usecase'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createChatPromptGroupSchema } from './schema/create.schema'

export const createChatPromptGroup = new Hono()

const route = createChatPromptGroup.post(
  '/chats/:uniqueKey/prompt-groups',
  privyAuthMiddleware,
  requireUserMiddleware,
  requireUserPromptUsage,
  zValidator('json', createChatPromptGroupSchema),
  async (c) => {
    try {
      const uniqueKey = c.req.param('uniqueKey')
      const { question } = c.req.valid('json')
      const userPromptUsage = c.get('userPromptUsage')

      const chat = await prisma.chat.findUnique({
        where: { uniqueKey },
        include: { user: true },
      })

      if (!chat) {
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError('NOT_FOUND', {
              message: 'Chat not found',
            }),
          },
          404,
        )
      }

      if (chat.userId !== c.var.user.id) {
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError('FORBIDDEN', {
              message: 'You can only create prompt groups for your own chats',
            }),
          },
          403,
        )
      }

      const promptGroupEntity = await generateUserResponseUsecase.execute(
        uniqueKey,
        question,
        userPromptUsage,
      )

      return c.json<HcApiResponseType<PromptGroupEntity>>(
        {
          data: promptGroupEntity,
        },
        201,
      )
    } catch (error) {
      console.error('Error chats/prompt-groups/create:', error)

      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('SERVER_ERROR'),
        },
        500,
      )
    }
  },
)

export type CreateChatPromptGroupRoute = typeof route

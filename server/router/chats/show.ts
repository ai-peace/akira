import { ChatEntity } from '@/domains/entities/chat.entity'
import { createHcApiError, HcApiResponseType } from '@/domains/errors/hc-api.error'
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

    if (!chat)
      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('NOT_FOUND', {
            resource: 'chat',
          }),
        },
        404,
      )

    const chatEntity = chatMapper.toDomain(chat)
    return c.json<HcApiResponseType<ChatEntity>>(
      {
        data: chatEntity,
      },
      200,
    )
  } catch (error) {
    console.error('Error fetching chat:', error)
    return c.json<HcApiResponseType<never>>(
      {
        error: createHcApiError('SERVER_ERROR'),
      },
      500,
    )
  }
})

export type GetChatRoute = typeof route

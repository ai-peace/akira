import { PromptGroupEntity } from '@/domains/entities/prompt-group.entity'
import { createHcApiError, HcApiResponseType } from '@/domains/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma'
import { promptGroupMapper } from '@/server/server-mappers/prompt-group/index.mapper'
import { Hono } from 'hono'

export const getPromptGroup = new Hono()

const route = getPromptGroup.get('/prompt-groups/:uniqueKey', async (c) => {
  try {
    const uniqueKey = c.req.param('uniqueKey')
    const promptGroup = await prisma.promptGroup.findUnique({
      where: {
        uniqueKey: uniqueKey,
      },
      include: {
        prompts: true,
        chat: true,
      },
    })

    if (!promptGroup)
      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('NOT_FOUND', {
            resource: 'promptGroup',
          }),
        },
        404,
      )

    const promptGroupEntity = promptGroupMapper.toDomain(promptGroup)
    return c.json<HcApiResponseType<PromptGroupEntity>>(
      {
        data: promptGroupEntity,
      },
      200,
    )
  } catch (error) {
    console.error('Error fetching prompt group:', error)
    return c.json<HcApiResponseType<never>>(
      {
        error: createHcApiError('SERVER_ERROR'),
      },
      500,
    )
  }
})

export type GetPromptGroupRoute = typeof route

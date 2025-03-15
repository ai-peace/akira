import { WaitListEntity } from '@/domains/entities/wait-list.entity'
import { createHcApiError, HcApiResponseType } from '@/domains/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { waitListMapper } from '@/server/server-mappers/wait-list/wait-list.mapper'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createWaitListSchema } from './schema/create.schema'

export const createWaitList = new Hono()

const route = createWaitList.post(
  '/wait-lists',
  zValidator('json', createWaitListSchema),
  async (c) => {
    try {
      const data = c.req.valid('json')

      const waitList = await prisma.waitlist.create({
        data: {
          uniqueKey: generateUniqueKey(),
          email: data.email,
        },
      })

      return c.json<HcApiResponseType<WaitListEntity>>(
        {
          data: waitListMapper.toDomain(waitList),
        },
        201,
      )
    } catch (error) {
      console.error('Error creating wait list:', error)
      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('WAITLIST_REGISTRATION_ERROR'),
        },
        500,
      )
    }
  },
)

export type CreateWaitListRoute = typeof route

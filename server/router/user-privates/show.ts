import { createHcApiError } from '@/domains/errors/hc-api.error'
import { UserPrivateEntity } from '@/domains/entities/user-private.entity'
import { HcApiResponseType } from '@/domains/errors/hc-api.error'
import { userPrivateMapper } from '@/server/server-mappers/user-private/user-private.mapper'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { Hono } from 'hono'

export const getUserPrivate = new Hono()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = getUserPrivate.get(
  '/user-privates',
  privyAuthMiddleware,
  requireUserMiddleware,
  async (c) => {
    try {
      const userPrivateEntity = userPrivateMapper.toDomain(c.var.user)
      return c.json<HcApiResponseType<UserPrivateEntity>>(
        {
          data: userPrivateEntity,
        },
        200,
      )
    } catch (error) {
      console.error('Error fetching user private:', error)
      return c.json<HcApiResponseType<never>>({ error: createHcApiError('SERVER_ERROR') }, 500)
    }
  },
)

export type GetUserPrivateRoute = typeof route

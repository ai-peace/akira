import { userPrivateMapper } from '@/server/server-mappers/user-private/user-private.mapper'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { Hono } from 'hono'

export const getUserPrivate = new Hono()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = getUserPrivate.get(
  '/users',
  privyAuthMiddleware,
  requireUserMiddleware,
  async (c) => {
    try {
      const userPrivateEntity = userPrivateMapper.toDomain(c.var.user)
      return c.json({ data: userPrivateEntity })
    } catch (error) {
      console.error('Error fetching user private:', error)
      return c.json({ error: 'Failed to fetch user private' }, 500)
    }
  },
)

export type GetUserPrivateRoute = typeof route

import { prisma } from '@/server/server-lib/prisma'
import { userPrivateMapper } from '@/server/server-mappers/user-private/user-private.mapper'
import { Hono } from 'hono'
import { privyAuthMiddleware } from '../../server-middleware/privy-auth.middleware'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

export const updateUserPrivate = new Hono()

// ユーザー更新のためのスキーマを定義
const updateUserSchema = z.object({
  name: z.string().optional(),
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = updateUserPrivate.patch(
  '/users',
  privyAuthMiddleware,
  zValidator('json', updateUserSchema),
  async (c) => {
    try {
      const privyId = c.get('privyId')
      const updateData = c.req.valid('json')

      const existingUser = await prisma.user.findUnique({
        where: {
          privyId,
        },
      })

      if (!existingUser) {
        return c.json({ error: 'User not found' }, 404)
      }

      const updatedUser = await prisma.user.update({
        where: {
          privyId,
        },
        data: updateData,
      })

      const userPrivateEntity = userPrivateMapper.toDomain(updatedUser)

      return c.json({
        data: userPrivateEntity,
      })
    } catch (error) {
      console.error('Error updating user private:', error)
      return c.json({ error: 'Failed to update user private' }, 500)
    }
  },
)

export type UpdateUserPrivateRoute = typeof route

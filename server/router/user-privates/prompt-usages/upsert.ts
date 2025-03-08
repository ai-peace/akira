import { UserPromptUsageEntity } from '@/domains/entities/user-prompt-usage.entity'
import { applicationServerConst } from '@/server/server-const/appilication.server-const'
import { prisma } from '@/server/server-lib/prisma'
import { Hono } from 'hono'
import { privyAuthMiddleware } from '../../../server-middleware/privy-auth.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'

export const upsertUserPromptUsage = new Hono()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = upsertUserPromptUsage.patch(
  '/user-prompt-usages',
  privyAuthMiddleware,
  requireUserMiddleware,
  async (c) => {
    try {
      const user = c.var.user
      const userPromptUsage = await prisma.userPromptUsage.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: new Date(),
          },
        },
      })

      let updatedUserPromptUsage: UserPromptUsageEntity | null = null
      if (!userPromptUsage) {
        updatedUserPromptUsage = await prisma.userPromptUsage.create({
          data: {
            userId: user.id,
            date: new Date(),
          },
        })
      } else {
        if (userPromptUsage.count >= applicationServerConst.dailyPromptUsageLimit.perUser) {
          return c.json({ error: 'Daily prompt usage limit reached' }, 403)
        }

        updatedUserPromptUsage = await prisma.userPromptUsage.update({
          where: {
            id: userPromptUsage.id,
          },
          data: {
            count: userPromptUsage.count + 1,
          },
        })
      }

      return c.json({ data: updatedUserPromptUsage })
    } catch (error) {
      console.error('Error upserting user prompt usage:', error)
      return c.json({ error: 'Failed to upsert user prompt usage' }, 500)
    }
  },
)

export type UpsertUserPromptUsageRoute = typeof route

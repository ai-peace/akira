import { UserPromptUsageEntity } from '@/domains/entities/user-prompt-usage.entity'
import { applicationServerConst } from '@/server/server-const/appilication.server-const'
import { prisma } from '@/server/server-lib/prisma'
import { Hono } from 'hono'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { createHcApiError } from '@/domains/errors/hc-api.error'
import { HcApiResponseType } from '@/domains/errors/hc-api.error'

export const upsertUserPromptUsage = new Hono()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = upsertUserPromptUsage.patch(
  '/user-prompt-usages',
  privyAuthMiddleware,
  requireUserMiddleware,
  async (c) => {
    try {
      const user = c.var.user

      // UTCの0時をベースにする
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)

      const userPromptUsage = await prisma.userPromptUsage.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: today, // UTCベースの日付を使用
          },
        },
      })

      let updatedUserPromptUsage: UserPromptUsageEntity | null = null
      if (!userPromptUsage) {
        updatedUserPromptUsage = await prisma.userPromptUsage.create({
          data: {
            userId: user.id,
            date: today, // UTCベースの日付を使用
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
      return c.json<HcApiResponseType<never>>({ error: createHcApiError('SERVER_ERROR') }, 500)
    }
  },
)

export type UpsertUserPromptUsageRoute = typeof route

import { prisma } from '@/server/server-lib/prisma'
import { userPromptUsageMapper } from '@/server/server-mappers/user-prompt-usage/user-prompt-usage.mapper'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { Hono } from 'hono'

export const initializeUserPromptUsage = new Hono()

const route = initializeUserPromptUsage.post(
  '/user-prompt-usages',
  privyAuthMiddleware,
  requireUserMiddleware,
  async (c) => {
    try {
      const user = c.var.user

      // トランザクションを使用して競合を防ぐ
      const userPromptUsage = await prisma.$transaction(async (tx) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const existing = await tx.userPromptUsage.findUnique({
          where: {
            userId_date: {
              userId: user.id,
              date: today,
            },
          },
        })

        if (existing) {
          return existing
        }

        return await tx.userPromptUsage.create({
          data: {
            userId: user.id,
            date: today,
          },
        })
      })

      const userPromptUsageEntity = userPromptUsageMapper.toDomain(userPromptUsage)
      return c.json({ data: userPromptUsageEntity })
    } catch (error) {
      console.error('Error initializing user prompt usage:', error)
      return c.json({ error: 'Failed to initialize user prompt usage' }, 500)
    }
  },
)

export type InitializeUserPromptUsageRoute = typeof route

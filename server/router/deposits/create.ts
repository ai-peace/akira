import { createHcApiError, HcApiResponseType } from '@/domains/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

// デポジットのスキーマを定義
const createDepositSchema = z.object({
  walletAddress: z.string(),
  amount: z.number(),
  signature: z.string(),
  uniqueKey: z.string(),
})

export const createDeposit = new Hono()

const route = createDeposit.post(
  '/deposits',
  privyAuthMiddleware,
  requireUserMiddleware,
  zValidator('json', createDepositSchema),
  async (c) => {
    try {
      const { walletAddress, amount, signature, uniqueKey } = c.req.valid('json')

      // デポジット情報を保存
      const deposit = await prisma.deposit.create({
        data: {
          uniqueKey,
          userId: c.var.user.id,
          walletAddress,
          amount,
          signature,
        },
      })

      return c.json<HcApiResponseType<{ success: boolean; deposit: any }>>(
        {
          data: { success: true, deposit },
        },
        201,
      )
    } catch (error) {
      console.error('Error creating deposit:', error)
      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('SERVER_ERROR'),
        },
        500,
      )
    }
  },
)

export type CreateDepositRoute = typeof route

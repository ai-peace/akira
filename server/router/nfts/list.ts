import { createHcApiError, HcApiResponseType } from '@/domains/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { Hono } from 'hono'

export const listNfts = new Hono()

const route = listNfts.get('/my-nfts', privyAuthMiddleware, requireUserMiddleware, async (c) => {
  try {
    const userId = c.var.user.id
    console.log('=== LIST USER NFTS ===')
    console.log('User ID:', userId)

    // ユーザーのNFTを取得
    const nfts = await prisma.nFT.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Found ${nfts.length} NFTs for user ${userId}`)

    return c.json<HcApiResponseType<{ nfts: any[] }>>(
      {
        data: {
          nfts,
        },
      },
      200,
    )
  } catch (error) {
    console.error('Error listing NFTs:', error)
    return c.json<HcApiResponseType<never>>(
      {
        error: createHcApiError('SERVER_ERROR'),
      },
      500,
    )
  }
})

export type ListNftsRoute = typeof route

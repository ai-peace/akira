import { createHcApiError, HcApiResponseType } from '@/domains/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

// NFTステータスのスキーマを定義
const nftStatusSchema = z.object({
  signature: z.string().optional(),
})

export const nftStatus = new Hono()

const route = nftStatus.get(
  '/nft-status',
  privyAuthMiddleware,
  requireUserMiddleware,
  zValidator('query', nftStatusSchema),
  async (c) => {
    try {
      const { signature } = c.req.valid('query')
      const userId = c.var.user.id

      console.log('=== NFT STATUS CHECK ===')
      console.log('User ID:', userId)
      console.log('Signature:', signature)

      // 署名が指定されている場合は、その署名に関連するデポジットを検索
      if (signature) {
        const deposit = await prisma.deposit.findFirst({
          where: {
            userId,
            signature,
          },
        })

        console.log('Deposit found:', deposit ? 'Yes' : 'No')

        // デポジットが見つかった場合、そのデポジットに関連するNFTを検索
        if (deposit) {
          const nft = await prisma.nFT.findFirst({
            where: {
              userId,
              walletAddress: deposit.walletAddress,
            },
          })

          console.log('NFT found:', nft ? 'Yes' : 'No')

          if (nft) {
            // NFTが見つかった場合、成功ステータスを返す
            return c.json<HcApiResponseType<{ status: string; nft: any }>>(
              {
                data: {
                  status: 'success',
                  nft,
                },
              },
              200,
            )
          } else {
            // NFTが見つからない場合、処理中ステータスを返す
            return c.json<HcApiResponseType<{ status: string }>>(
              {
                data: {
                  status: 'processing',
                },
              },
              200,
            )
          }
        }
      }

      // 署名が指定されていない場合や、デポジットが見つからない場合は、
      // ユーザーのすべてのNFTを取得
      const nfts = await prisma.nFT.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return c.json<HcApiResponseType<{ status: string; nfts: any[] }>>(
        {
          data: {
            status: 'list',
            nfts,
          },
        },
        200,
      )
    } catch (error) {
      console.error('Error checking NFT status:', error)
      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('SERVER_ERROR'),
        },
        500,
      )
    }
  },
)

export type NftStatusRoute = typeof route

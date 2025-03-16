import { createHcApiError, HcApiResponseType } from '@/domains/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { Connection, PublicKey } from '@solana/web3.js'
import { SOLANA_RPC_ENDPOINT } from '@/config/solana.config'
import { mintNFT } from '@/services/nft.service'
import { v4 as uuidv4 } from 'uuid'

// NFTミントのスキーマを定義
const mintNftSchema = z.object({
  productId: z.string(),
  walletAddress: z.string(),
})

export const mintNft = new Hono()

const route = mintNft.post(
  '/mint-nft',
  privyAuthMiddleware,
  requireUserMiddleware,
  zValidator('json', mintNftSchema),
  async (c) => {
    console.log('=== NFT MINT API START ===')
    console.log('Request received:', {
      path: c.req.path,
      method: c.req.method,
      headers: Object.fromEntries(c.req.raw.headers.entries()),
    })

    try {
      const { productId, walletAddress } = c.req.valid('json')
      console.log('Validated request body:', { productId, walletAddress })
      console.log('User ID from middleware:', c.var.user.id)

      // デポジット確認
      console.log('Checking for deposit...')
      const deposit = await prisma.deposit.findFirst({
        where: {
          userId: c.var.user.id,
          walletAddress,
          used: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      console.log('Deposit check result:', deposit ? 'Found' : 'Not found')
      if (deposit) {
        console.log('Deposit details:', {
          id: deposit.id,
          uniqueKey: deposit.uniqueKey,
          amount: deposit.amount,
          signature: deposit.signature,
          createdAt: deposit.createdAt,
        })
      }

      if (!deposit) {
        console.log('No available deposit found, returning 404')
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError('NOT_FOUND', {
              message: 'No available deposit found',
              resource: 'deposit',
            }),
          },
          404,
        )
      }

      // 商品情報を取得（実際のプロジェクトでは商品データベースから取得）
      // ここでは簡易的に商品情報を作成
      console.log('Creating sample product data for:', productId)
      const product = {
        uniqueKey: productId,
        title: {
          en: 'Sample Product',
          ja: 'サンプル商品',
        },
        price: 1000,
        currency: 'JPY',
        description: 'This is a sample product for NFT minting',
        imageUrl: 'https://example.com/sample.jpg',
        status: 'In Stock',
        itemCode: '12345',
        shopName: 'Sample Shop',
        shopIconUrl: 'https://example.com/shop-icon.jpg',
        url: 'https://example.com/product',
      }

      // Solana接続
      console.log('Connecting to Solana RPC endpoint:', SOLANA_RPC_ENDPOINT)
      const connection = new Connection(SOLANA_RPC_ENDPOINT)

      // 管理者の秘密鍵（環境変数から）
      console.log('Checking for admin private key...')
      const adminPrivateKey = process.env.SOLANA_ADMIN_PRIVATE_KEY
      if (!adminPrivateKey) {
        console.log('Admin key not configured, returning 500')
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError('SERVER_ERROR', {
              message: 'Admin key not configured',
            }),
          },
          500,
        )
      }
      console.log('Admin private key found (length):', adminPrivateKey.length)

      try {
        // 秘密鍵をUint8Arrayに変換
        console.log('Parsing admin keypair...')
        const adminKeypair = Uint8Array.from(JSON.parse(adminPrivateKey))
        console.log('Admin keypair parsed successfully, length:', adminKeypair.length)

        // NFT発行
        console.log('Minting NFT for wallet:', walletAddress)
        const result = await mintNFT(
          connection,
          new PublicKey(walletAddress),
          adminKeypair,
          product,
        )
        console.log('Mint result:', result)

        if (!result.success) {
          console.log('NFT minting failed:', result.error)
          return c.json<HcApiResponseType<never>>(
            {
              error: createHcApiError('SERVER_ERROR', {
                message: result.error || 'Failed to mint NFT',
              }),
            },
            500,
          )
        }

        // デポジットを使用済みにマーク
        console.log('Marking deposit as used:', deposit.id)
        await prisma.deposit.update({
          where: { id: deposit.id },
          data: { used: true },
        })
        console.log('Deposit marked as used successfully')

        // NFT情報を保存
        console.log('Saving NFT information to database...')
        const nft = await prisma.nFT.create({
          data: {
            uniqueKey: uuidv4(),
            mintAddress: result.mintAddress,
            metadata: result.metadata,
            productId: product.uniqueKey,
            userId: c.var.user.id,
            walletAddress,
          },
        })
        console.log('NFT saved successfully:', nft.uniqueKey)

        console.log('=== NFT MINT API SUCCESS ===')
        return c.json<
          HcApiResponseType<{ success: boolean; mintAddress: string; metadata: string; nft: any }>
        >(
          {
            data: {
              success: true,
              mintAddress: result.mintAddress,
              metadata: result.metadata,
              nft,
            },
          },
          200,
        )
      } catch (parseError) {
        console.error('Error parsing admin keypair:', parseError)
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError('SERVER_ERROR', {
              message: 'Failed to parse admin keypair',
            }),
          },
          500,
        )
      }
    } catch (error) {
      console.error('=== NFT MINT API ERROR ===')
      console.error('Error minting NFT:', error)
      if (error instanceof Error) {
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('SERVER_ERROR'),
        },
        500,
      )
    }
  },
)

export type MintNftRoute = typeof route

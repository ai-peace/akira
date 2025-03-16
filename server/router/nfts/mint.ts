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
import { ProductEntity } from '@/domains/entities/product.entity'

// NFTミントのスキーマを定義
const mintNftSchema = z.object({
  productUniqueKey: z.string(),
  promptGroupUniqueKey: z.string().optional(),
})

export const mintNft = new Hono()

// 認証ミドルウェアを適用
mintNft.use('*', privyAuthMiddleware)
mintNft.use('*', requireUserMiddleware)

const route = mintNft.post('/mint-nft', zValidator('json', mintNftSchema), async (c) => {
  console.log('=== NFT MINT API START ===')
  console.log('Request received:', {
    path: c.req.path,
    method: c.req.method,
    headers: Object.fromEntries(c.req.raw.headers.entries()),
  })

  try {
    const { productUniqueKey, promptGroupUniqueKey } = c.req.valid('json')
    // @ts-ignore - c.varの型定義の問題を一時的に無視
    const userId = c.var.user.id
    console.log('Validated request body:', { productUniqueKey, promptGroupUniqueKey })
    console.log('User ID from middleware:', userId)

    // プロンプトグループから商品情報を取得
    let product: ProductEntity | null = null

    // プロンプトグループのuniqueKeyが指定されている場合は、DBから商品情報を取得
    if (promptGroupUniqueKey) {
      console.log(
        `Fetching product data from prompt group: ${promptGroupUniqueKey}, product ID: ${productUniqueKey}`,
      )

      // プロンプトグループを取得
      const promptGroup = await prisma.promptGroup.findUnique({
        where: {
          uniqueKey: promptGroupUniqueKey,
        },
        include: {
          prompts: true,
        },
      })

      if (!promptGroup) {
        console.log(`Prompt group not found: ${promptGroupUniqueKey}`)
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError('NOT_FOUND', {
              message: 'Prompt group not found',
              resource: 'promptGroup',
            }),
          },
          404,
        )
      }

      console.log(`Found prompt group: ${promptGroup.uniqueKey}`)

      // プロンプトグループから商品情報を検索
      let foundProduct: ProductEntity | null = null

      // 各プロンプトの結果を確認
      for (const prompt of promptGroup.prompts) {
        if (prompt.result && prompt.llmStatus === 'SUCCESS') {
          const result = prompt.result as any

          // データ配列がある場合
          if (result.data && Array.isArray(result.data)) {
            // 指定されたproductIdに一致する商品を検索
            foundProduct = result.data.find((p: any) => p.uniqueKey === productUniqueKey)

            if (foundProduct) {
              console.log(`Found product in prompt results: ${foundProduct.uniqueKey}`)
              break
            }
          }
        }
      }

      if (foundProduct) {
        product = foundProduct
      } else {
        console.log(`Product not found in prompt group: ${productUniqueKey}`)
      }
    }

    // 商品情報が見つからない場合はサンプルデータを使用
    if (!product) {
      console.log('Using sample product data for:', productUniqueKey)
      product = {
        uniqueKey: productUniqueKey,
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
    }

    // ユーザーのウォレットアドレスを取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.solanaSystemAccountAddress) {
      console.log('Wallet address not found for user:', userId)
      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('NOT_FOUND', {
            message: 'Wallet address not found for user',
            resource: 'user',
          }),
        },
        404,
      )
    }

    // Solana接続
    console.log('Connecting to Solana RPC endpoint:', SOLANA_RPC_ENDPOINT)
    const connection = new Connection(SOLANA_RPC_ENDPOINT)
    const walletAddress = new PublicKey(user.solanaSystemAccountAddress)

    // 管理者の秘密鍵を取得
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
        walletAddress,
        adminKeypair,
        product,
        promptGroupUniqueKey,
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

      // NFT情報を保存
      console.log('Saving NFT information to database...')
      const nft = await prisma.nFT.create({
        data: {
          uniqueKey: uuidv4(),
          mintAddress: result.mintAddress,
          metadata: result.metadata,
          productId: product.uniqueKey,
          promptGroupUniqueKey: promptGroupUniqueKey || null,
          userId: userId,
          walletAddress: user.solanaSystemAccountAddress,
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
})

export type MintNftRoute = typeof route

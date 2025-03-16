import { NextApiRequest, NextApiResponse } from 'next'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { PrivyClient } from '@privy-io/server-auth'
import { mintNFT } from '@/services/nft.service'
import { SOLANA_RPC_ENDPOINT } from '@/config/solana.config'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ユーザー認証
  const authToken = req.headers.authorization?.replace('Bearer ', '')
  if (!authToken) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const privy = new PrivyClient(
      process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
      process.env.PRIVY_APP_SECRET || '',
    )

    // トークンを検証
    const verifiedClaims = await privy.verifyAuthToken(authToken)
    const privyId = verifiedClaims.userId

    if (!privyId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { productId, walletAddress } = req.body

    if (!productId || !walletAddress) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { privyId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // デポジット確認
    const deposit = await prisma.deposit.findFirst({
      where: {
        userId: user.id,
        walletAddress,
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!deposit) {
      return res.status(400).json({ error: 'No available deposit found' })
    }

    // 商品情報を取得（実際のプロジェクトでは商品データベースから取得）
    // ここでは簡易的に商品情報を作成
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
    const connection = new Connection(SOLANA_RPC_ENDPOINT)

    // 管理者の秘密鍵（環境変数から）
    const adminPrivateKey = process.env.SOLANA_ADMIN_PRIVATE_KEY
    if (!adminPrivateKey) {
      return res.status(500).json({ error: 'Admin key not configured' })
    }

    // 秘密鍵をUint8Arrayに変換
    const adminKeypair = Uint8Array.from(JSON.parse(adminPrivateKey))

    // NFT発行
    const result = await mintNFT(connection, new PublicKey(walletAddress), adminKeypair, product)

    if (!result.success) {
      return res.status(500).json({ error: result.error })
    }

    // デポジットを使用済みにマーク
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { used: true },
    })

    // NFT情報を保存
    const nft = await prisma.nFT.create({
      data: {
        uniqueKey: uuidv4(),
        mintAddress: result.mintAddress,
        metadata: result.metadata,
        productId: product.uniqueKey,
        userId: user.id,
        walletAddress,
      },
    })

    return res.status(200).json({
      success: true,
      mintAddress: result.mintAddress,
      metadata: result.metadata,
      nft,
    })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

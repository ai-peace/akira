import { NextApiRequest, NextApiResponse } from 'next'
import { PrivyClient } from '@privy-io/server-auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    const { wallet } = req.query

    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' })
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { privyId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // NFT一覧を取得
    const nfts = await prisma.nFT.findMany({
      where: {
        userId: user.id,
        walletAddress: wallet as string,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.status(200).json({ nfts })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

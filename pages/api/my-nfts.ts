import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ユーザー認証
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { wallet } = req.query

    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' })
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { uniqueKey: session.user.uniqueKey },
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

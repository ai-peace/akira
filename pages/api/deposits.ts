import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ユーザー認証
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { walletAddress, amount, signature, uniqueKey } = req.body

    if (!walletAddress || !amount || !signature || !uniqueKey) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { uniqueKey: session.user.uniqueKey },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // デポジット情報を保存
    const deposit = await prisma.deposit.create({
      data: {
        uniqueKey,
        userId: user.id,
        walletAddress,
        amount,
        signature,
      },
    })

    return res.status(200).json({ success: true, deposit })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

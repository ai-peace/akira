import { prisma } from '@/server/server-lib/prisma'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { userPrivateMapper } from '@/server/server-mappers/user-private/user-private.mapper'
import { Hono } from 'hono'
import { privyAuthMiddleware } from '../../server-middleware/privy-auth.middleware'

export const createUserPrivate = new Hono()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = createUserPrivate.post('/users', privyAuthMiddleware, async (c) => {
  try {
    const privyId = c.get('privyId')
    const privyUser = c.get('privyUser')

    console.log('privyUser------------', privyUser)

    const email =
      typeof privyUser.email === 'string' ? privyUser.email : privyUser.email?.address || ''
    const loginMethod = privyUser.linkedAccounts?.[0]?.type || 'email'
    const name = privyUser.wallet?.address || ''

    // solana privy接続ができるまでの暫定
    const walletAddress = privyUser.wallet?.address || ''

    const userPrivate = await prisma.user.create({
      data: {
        uniqueKey: generateUniqueKey(),
        email,
        loginMethod,
        privyId,
        name,
        solanaSystemAccountAddress: walletAddress,
      },
    })

    const userPrivateEntity = userPrivateMapper.toDomain(userPrivate)

    return c.json({
      data: userPrivateEntity,
    })
  } catch (error) {
    console.error('Error creating user private:', error)
    return c.json({ error: 'Failed to create user private' }, 500)
  }
})

export type CreateUserPrivateRoute = typeof route

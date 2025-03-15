import { prisma } from '@/server/server-lib/prisma'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { userPrivateMapper } from '@/server/server-mappers/user-private/user-private.mapper'
import { Hono } from 'hono'
import { privyAuthMiddleware } from '../../server-middleware/privy-auth.middleware'
import { faker } from '@faker-js/faker'
import { createHcApiError } from '@/domains/errors/hc-api.error'
import { UserPrivateEntity } from '@/domains/entities/user-private.entity'
import { HcApiResponseType } from '@/domains/errors/hc-api.error'
import { clientApplicationProperties } from '@/consts/client-application-properties'

export const createUserPrivate = new Hono()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = createUserPrivate.post('/users', privyAuthMiddleware, async (c) => {
  try {
    const privyId = c.get('privyId')
    const privyUser = c.get('privyUser')

    const userCount = await prisma.user.count()
    if (userCount >= clientApplicationProperties.userRegistrationCap) {
      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('USER_REGISTRATION_CAP_EXCEEDED', {
            message: 'ユーザー登録の上限に達しました。',
          }),
        },
        403,
      )
    }

    const email =
      typeof privyUser.email === 'string' ? privyUser.email : privyUser.email?.address || ''
    const loginMethod = privyUser.linkedAccounts?.[0]?.type || 'email'

    // ランダムなニックネームを生成
    const name = faker.internet.userName()

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

    return c.json<HcApiResponseType<UserPrivateEntity>>(
      {
        data: userPrivateEntity,
      },
      201,
    )
  } catch (error) {
    console.error('Error creating user private:', error)
    return c.json<HcApiResponseType<never>>({ error: createHcApiError('SERVER_ERROR') }, 500)
  }
})

export type CreateUserPrivateRoute = typeof route

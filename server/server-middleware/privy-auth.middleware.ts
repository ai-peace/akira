import { PrivyClient, User } from '@privy-io/server-auth'
import { createMiddleware } from 'hono/factory'
import { applicationServerConst } from '../server-const/appilication.server-const'
import { HcApiResponseType } from '@/domains/errors/hc-api.error'
import { createHcApiError } from '@/domains/errors/hc-api.error'

export const privyAuthMiddleware = createMiddleware<{
  Variables: {
    privyId: string
    privyUser: User
    walletAddress: string
  }
}>(async (c, next) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return c.json<HcApiResponseType<never>>({ error: createHcApiError('UNAUTHORIZED') }, 401)
    }

    const privy = new PrivyClient(
      applicationServerConst.privy.appId,
      applicationServerConst.privy.secret,
    )

    try {
      const verifiedClaims = await privy.verifyAuthToken(authToken)
      const privyId = verifiedClaims.userId

      if (!privyId)
        return c.json<HcApiResponseType<never>>(
          { error: createHcApiError('VERIFICATION_ERROR') },
          401,
        )

      const privyUser = await privy.getUserById(privyId)

      // ウォレットアドレスを取得
      const walletAddress = privyUser.wallet?.address || ''

      c.set('privyId', privyId)
      c.set('privyUser', privyUser)
      c.set('walletAddress', walletAddress)
      await next()
    } catch (verifyError: any) {
      console.error('Privy token verification error:', verifyError)

      // JWTの期限切れエラーを具体的にハンドリング
      if (verifyError.code === 'ERR_JWT_EXPIRED') {
        return c.json<HcApiResponseType<never>>({ error: createHcApiError('TOKEN_EXPIRED') }, 401)
      }

      // その他の認証エラー
      return c.json<HcApiResponseType<never>>(
        { error: createHcApiError('VERIFICATION_ERROR') },
        401,
      )
    }
  } catch (error) {
    console.error('Privy auth error:', error)
    return c.json<HcApiResponseType<never>>({ error: createHcApiError('VERIFICATION_ERROR') }, 401)
  }
})

import { PrivyClient, User } from '@privy-io/server-auth'
import { createMiddleware } from 'hono/factory'
import { applicationServerConst } from '../server-const/appilication.server-const'

export const privyAuthMiddleware = createMiddleware<{
  Variables: {
    privyId: string
    privyUser: User
  }
}>(async (c, next) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')

    console.log('Privy Auth - Token:', authToken ? `${authToken.substring(0, 10)}...` : 'No token')
    console.log('Privy Auth - App ID:', applicationServerConst.privy.appId)
    console.log('Privy Auth - Client ID:', applicationServerConst.privy.clientId)

    if (!authToken) {
      return c.json({ error: 'No authorization token provided' }, 401)
    }

    const privy = new PrivyClient(
      applicationServerConst.privy.appId,
      applicationServerConst.privy.clientId,
    )

    try {
      const verifiedClaims = await privy.verifyAuthToken(authToken)
      const privyId = verifiedClaims.userId

      if (!privyId) return c.json({ error: 'Invalid token: privyId not found' }, 401)

      console.log('Privy Auth - Verified privyId:', privyId)

      // Privyからユーザー情報を取得
      // 最新のAPIでは、getUserByIdを使用
      const privyUser = await privy.getUserById(privyId)
      console.log('Privy Auth - User retrieved successfully')

      c.set('privyId', privyId)
      c.set('privyUser', privyUser)
      await next()
    } catch (verifyError) {
      console.error('Privy token verification error:', verifyError)
      return c.json({ error: 'Invalid authentication token' }, 401)
    }
  } catch (error) {
    console.error('Privy auth error:', error)
    return c.json({ error: 'Authentication failed' }, 401)
  }
})

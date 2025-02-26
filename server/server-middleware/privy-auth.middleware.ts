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

    if (!authToken) {
      return c.json({ error: 'No authorization token provided' }, 401)
    }

    const privy = new PrivyClient(
      applicationServerConst.privy.appId,
      applicationServerConst.privy.secret,
    )

    try {
      const verifiedClaims = await privy.verifyAuthToken(authToken)
      const privyId = verifiedClaims.userId

      if (!privyId) return c.json({ error: 'Invalid token: privyId not found' }, 401)

      const privyUser = await privy.getUserById(privyId)

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

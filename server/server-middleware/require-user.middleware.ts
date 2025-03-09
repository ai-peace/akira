import { createHcApiError, HcApiResponseType } from '@/domains/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma'
import { User } from '@prisma/client'
import { createMiddleware } from 'hono/factory'

export const requireUserMiddleware = createMiddleware<{
  Variables: {
    privyId: string
    user: User
  }
}>(async (c, next) => {
  try {
    const privyId = c.get('privyId')
    const user = await prisma.user.findUnique({
      where: {
        privyId: privyId,
      },
    })

    if (!user) {
      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('NOT_FOUND'),
        },
        404,
      )
    }

    c.set('user', user)
    await next()
  } catch (error) {
    console.error('Error fetching user:', error)
    return c.json<HcApiResponseType<never>>(
      {
        error: createHcApiError('SERVER_ERROR'),
      },
      500,
    )
  }
})

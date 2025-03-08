import { prisma } from '@/server/server-lib/prisma'
import { createMiddleware } from 'hono/factory'
import { User } from '@prisma/client'
import { HcApiResponse } from '@/domains/types/hc-api-response.types'
import { createServerAppError } from '@/domains/error-codes/server.error-codes'

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
      return c.json<HcApiResponse<never>>(
        {
          error: createServerAppError('NOT_FOUND'),
        },
        404,
      )
    }

    c.set('user', user)
    await next()
  } catch (error) {
    console.error('Error fetching user:', error)
    return c.json<HcApiResponse<never>>(
      {
        error: createServerAppError('SERVER_ERROR'),
      },
      500,
    )
  }
})

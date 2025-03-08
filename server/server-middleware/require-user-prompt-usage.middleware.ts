import { prisma } from '@/server/server-lib/prisma'
import { createMiddleware } from 'hono/factory'
import { User, UserPromptUsage } from '@prisma/client'
import { clientApplicationProperties } from '@/consts/client-application-properties'
import { createServerAppError } from '@/domains/error-codes/server.error-codes'
import { HcApiResponse } from '@/domains/types/hc-api-response.types'

export const requireUserPromptUsage = createMiddleware<{
  Variables: {
    privyId: string
    user: User
    userPromptUsage: UserPromptUsage
  }
}>(async (c, next) => {
  try {
    const user = c.get('user')

    let userPromptUsage = await prisma.userPromptUsage.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: new Date(),
        },
      },
    })

    if (!userPromptUsage) {
      userPromptUsage = await prisma.userPromptUsage.create({
        data: {
          userId: user.id,
          date: new Date(),
        },
      })
    }

    if (userPromptUsage.count >= clientApplicationProperties.dailyPromptUsageLimit.perUser) {
      return c.json<HcApiResponse<never>>(
        {
          error: createServerAppError('DAILY_PROMPT_USAGE_LIMIT_EXCEEDED'),
        },
        403,
      )
    }

    c.set('userPromptUsage', userPromptUsage)
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

import { clientApplicationProperties } from '@/consts/client-application-properties'
import { createHcApiError, HcApiResponseType } from '@/domains/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma'
import { User, UserPromptUsage } from '@prisma/client'
import { createMiddleware } from 'hono/factory'

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
      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('DAILY_PROMPT_USAGE_LIMIT_EXCEEDED'),
        },
        403,
      )
    }

    c.set('userPromptUsage', userPromptUsage)
    await next()
  } catch (error) {
    console.error('Error fetching user:', error)
    return c.json<HcApiResponseType<never>>(
      {
        error: createHcApiError('CHECK_USER_PROMPT_USAGE_ERROR'),
      },
      500,
    )
  }
})

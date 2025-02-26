import { prisma } from '@/server/server-lib/prisma'
import { createMiddleware } from 'hono/factory'
import { User } from '@prisma/client'

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
      return c.json({ error: 'User not found' }, 404)
    }

    c.set('user', user)
    await next()
  } catch (error) {
    console.error('Error fetching user:', error)
    return c.json({ error: 'Failed to fetch user' }, 500)
  }
})

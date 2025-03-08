import { UserPromptUsage } from '@prisma/client'
import { prisma } from '../server-lib/prisma'

const increment = async (userPromptUsage: UserPromptUsage) => {
  const updatedUserPromptUsage = await prisma.userPromptUsage.update({
    where: {
      id: userPromptUsage.id,
    },
    data: {
      count: userPromptUsage.count + 1,
    },
  })

  return updatedUserPromptUsage
}

export const userPromptUsageService = {
  increment,
}

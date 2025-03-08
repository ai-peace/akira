import { UserPromptUsageEntity } from '@/domains/entities/user-prompt-usage.entity'
import { UserPromptUsage } from '@prisma/client'

export const userPromptUsageMapper = {
  toDomain: (prismaUserPromptUsage: UserPromptUsage): UserPromptUsageEntity => {
    return {
      date: prismaUserPromptUsage.date,
      count: prismaUserPromptUsage.count,
    }
  },
}

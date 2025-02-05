import { PromptEntity } from '@/domains/entities/prompt.entity'
import { Prompt } from '@prisma/client'

export const promptMapper = {
  toDomain: (prompt: Prompt): PromptEntity => {
    return {
      uniqueKey: prompt.uniqueKey,
      result: prompt.result ?? undefined,
      resultType: prompt.resultType ?? undefined,
      llmStatus: prompt.llmStatus,
      llmStatusChangeAt: prompt.llmStatusChangeAt ?? undefined,
      llmError: prompt.llmError ?? undefined,
      updatedAt: prompt.updatedAt,
      createdAt: prompt.createdAt,
    }
  },

  toDomainCollection: (prompts: Prompt[]): PromptEntity[] => {
    return prompts.map(promptMapper.toDomain)
  },
}

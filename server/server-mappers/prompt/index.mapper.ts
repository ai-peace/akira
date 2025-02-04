import { PromptEntity } from '@/domains/entities/prompt.entity'
import { Prompt } from '@prisma/client'

const promptMapper = {
  toDomain: (prompt: Prompt): PromptEntity => {
    return {
      uniqueKey: prompt.uniqueKey,
      mainPrompt: prompt.mainPrompt ?? '',
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

export default promptMapper

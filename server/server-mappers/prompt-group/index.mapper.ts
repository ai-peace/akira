import { PromptGroupEntity } from '@/domains/entities/prompt-group.entity'
import { Prompt, PromptGroup } from '@prisma/client'
import { promptMapper } from '../prompt/index.mapper'

export const promptGroupMapper = {
  toDomain: (promptGroup: PromptGroup & { prompts?: Prompt[] }): PromptGroupEntity => {
    return {
      uniqueKey: promptGroup.uniqueKey,
      question: promptGroup.question ?? '',
      prompts: promptMapper.toDomainCollection(promptGroup.prompts ?? []),
      updatedAt: promptGroup.updatedAt,
      createdAt: promptGroup.createdAt,
    }
  },

  toDomainCollection: (
    promptGroups: (PromptGroup & { prompts?: Prompt[] })[],
  ): PromptGroupEntity[] => {
    return promptGroups.map(promptGroupMapper.toDomain)
  },
}

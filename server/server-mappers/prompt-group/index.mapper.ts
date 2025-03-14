import { PromptGroupEntity } from '@/domains/entities/prompt-group.entity'
import { Chat, Prompt, PromptGroup } from '@prisma/client'
import { promptMapper } from '../prompt/index.mapper'

export const promptGroupMapper = {
  toDomain: (promptGroup: PromptGroup & { chat: Chat; prompts?: Prompt[] }): PromptGroupEntity => {
    return {
      uniqueKey: promptGroup.uniqueKey,
      question: promptGroup.question ?? '',
      prompts: promptMapper.toDomainCollection(promptGroup.prompts ?? []),
      updatedAt: promptGroup.updatedAt,
      createdAt: promptGroup.createdAt,
      chatUniqueKey: promptGroup.chat?.uniqueKey,
    }
  },

  toDomainCollection: (
    promptGroups: (PromptGroup & { chat: Chat; prompts?: Prompt[] })[],
  ): PromptGroupEntity[] => {
    return promptGroups.map(promptGroupMapper.toDomain)
  },
}

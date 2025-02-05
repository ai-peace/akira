import { ChatEntity } from '@/domains/entities/chat.entity'
import { PromptGroupEntity } from '@/domains/entities/prompt-group.entity'
import { Chat, PromptGroup } from '@prisma/client'
import { promptGroupMapper } from '../prompt-group/index.mapper'

export const chatMapper = {
  toDomain: (
    prismaChat: Chat & {
      promptGroups: PromptGroup[]
    },
  ): ChatEntity & {
    promptGroups: PromptGroupEntity[]
  } => {
    return {
      uniqueKey: prismaChat.uniqueKey,
      title: prismaChat.title ?? undefined,
      mdxContent: prismaChat.mdxContent ?? undefined,
      promptGroups: promptGroupMapper.toDomainCollection(prismaChat.promptGroups),
      updatedAt: prismaChat.updatedAt,
      createdAt: prismaChat.createdAt,
    }
  },

  toDomainCollection: (
    prismaChats: (Chat & {
      promptGroups: PromptGroup[]
    })[],
  ): ChatEntity[] => {
    return prismaChats.map(chatMapper.toDomain)
  },
}

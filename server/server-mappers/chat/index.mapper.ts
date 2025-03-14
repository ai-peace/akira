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
    const promptGroupsWithChat = prismaChat.promptGroups.map((pg) => ({
      ...pg,
      chat: prismaChat,
    }))

    return {
      uniqueKey: prismaChat.uniqueKey,
      title: prismaChat.title ?? undefined,
      mdxContent: prismaChat.mdxContent ?? undefined,
      promptGroups: promptGroupMapper.toDomainCollection(promptGroupsWithChat),
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

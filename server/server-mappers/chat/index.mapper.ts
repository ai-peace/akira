import { ChatEntity } from '@/domains/entities/chat.entity'
import { Chat, Prompt } from '@prisma/client'
import { chatPromptRelationMapper } from './relation/chat-prompt-relation.mapper'
import { PromptEntity } from '@/domains/entities/prompt.entity'

export const chatMapper = {
  toDomain: (
    prismaChat: Chat & {
      prompts?: Prompt[]
    },
  ): ChatEntity & {
    prompts: PromptEntity[]
  } => {
    return {
      uniqueKey: prismaChat.uniqueKey,
      title: prismaChat.title ?? undefined,
      mdxContent: prismaChat.mdxContent ?? undefined,
      prompts: chatPromptRelationMapper.toDomain(prismaChat.prompts),
      updatedAt: prismaChat.updatedAt,
      createdAt: prismaChat.createdAt,
    }
  },

  toDomainCollection: (
    prismaChats: (Chat & {
      prompts?: Prompt[]
    })[],
  ): ChatEntity[] => {
    return prismaChats.map(chatMapper.toDomain)
  },
}

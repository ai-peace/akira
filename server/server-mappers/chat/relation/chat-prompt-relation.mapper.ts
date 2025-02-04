import { Chat, Prompt } from '@prisma/client'
import { ChatEntity } from '@/domains/entities/chat.entity'
import { chatMapper } from '../index.mapper'
import { PromptEntity } from '@/domains/entities/prompt.entity'
import promptMapper from '../../prompt/index.mapper'

export const chatPromptRelationMapper = {
  toDomain: (prompts?: Prompt[]): PromptEntity[] => {
    return prompts?.map(promptMapper.toDomain) ?? []
  },

  toDomainCollection: (
    chats: (Chat & {
      prompts?: Prompt[]
    })[],
  ): ChatEntity[] => {
    return chats.map(chatMapper.toDomain)
  },
}

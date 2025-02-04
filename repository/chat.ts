import { hcClient } from '@/api-client/hc.api-client'
import { ChatEntity } from '@/domains/entities/chat.entity'
import type { InferRequestType } from 'hono/client'

const client = hcClient()
export type GetChatInput = InferRequestType<(typeof client.chats)[':uniqueKey']['$get']>
export type CreateChatInput = InferRequestType<typeof client.chats.$post>

export const chatRepository = {
  get: async (uniqueKey: string): Promise<ChatEntity | null> => {
    try {
      const client = hcClient()
      const res = await client.chats[':uniqueKey'].$get({ param: { uniqueKey } })
      const json = await res.json()

      if (!('data' in json)) throw new Error('Failed to fetch chat')
      const data = json.data

      return {
        ...data,
        updatedAt: new Date(data.updatedAt),
        createdAt: new Date(data.createdAt),
        prompts: data.prompts.map((prompt) => ({
          ...prompt,
          llmStatusChangeAt: prompt.llmStatusChangeAt
            ? new Date(prompt.llmStatusChangeAt)
            : undefined,
          updatedAt: new Date(prompt.updatedAt),
          createdAt: new Date(prompt.createdAt),
        })),
      }
    } catch (error) {
      console.error('Error fetching chat:', error)
      throw error
    }
  },

  create: async (input: CreateChatInput): Promise<ChatEntity> => {
    try {
      const client = hcClient()
      const res = await client.chats.$post({ json: input.json })
      const json = await res.json()

      if (!('data' in json)) throw new Error('Failed to create chat')
      const data = json.data

      return {
        ...data,
        updatedAt: new Date(data.updatedAt),
        createdAt: new Date(data.createdAt),
        prompts: data.prompts.map((prompt) => ({
          ...prompt,
          llmStatusChangeAt: prompt.llmStatusChangeAt
            ? new Date(prompt.llmStatusChangeAt)
            : undefined,
          updatedAt: new Date(prompt.updatedAt),
          createdAt: new Date(prompt.createdAt),
        })),
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  },
}

import { hcClient } from '@/api-client/hc.api-client'
import { ChatEntity } from '@/domains/entities/chat.entity'
import { HcApiError } from '@/domains/error-codes/index.error-codes'
import type { InferRequestType } from 'hono/client'

const client = hcClient()
export type CreateChatInput = InferRequestType<typeof client.chats.$post>

const get = async (uniqueKey: string): Promise<ChatEntity | null> => {
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
      promptGroups: (data.promptGroups as any[]).map((promptGroup) => ({
        ...promptGroup,
        updatedAt: new Date(promptGroup.updatedAt),
        createdAt: new Date(promptGroup.createdAt),
        prompts: (promptGroup.prompts as any[]).map((prompt) => ({
          ...prompt,
          llmStatusChangeAt: prompt.llmStatusChangeAt
            ? new Date(prompt.llmStatusChangeAt)
            : undefined,
          updatedAt: new Date(prompt.updatedAt),
          createdAt: new Date(prompt.createdAt),
        })),
      })),
    }
  } catch (error) {
    console.error('Error fetching chat:', error)
    throw error
  }
}

const create = async (input: CreateChatInput, token: string): Promise<ChatEntity> => {
  try {
    const client = hcClient({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const res = await client.chats.$post({ json: input.json })
    const json = await res.json()

    if (res.ok && 'data' in json) {
      const data = json.data as ChatEntity

      return {
        ...data,
        updatedAt: new Date(data.updatedAt),
        createdAt: new Date(data.createdAt),
        promptGroups: data.promptGroups?.map((promptGroup: any) => ({
          ...promptGroup,
          updatedAt: new Date(promptGroup.updatedAt),
          createdAt: new Date(promptGroup.createdAt),
          prompts: promptGroup.prompts?.map((prompt: any) => ({
            ...prompt,
            llmStatusChangeAt: prompt.llmStatusChangeAt
              ? new Date(prompt.llmStatusChangeAt)
              : undefined,
            updatedAt: new Date(prompt.updatedAt),
            createdAt: new Date(prompt.createdAt),
          })),
        })),
      }
    } else if (!res.ok && 'error' in json) {
      throw new HcApiError(
        json.error?.code ?? 'UNKNOWN_ERROR',
        json.error?.message ?? '',
        json.error,
      )
    } else {
      throw new HcApiError('UNKNOWN_ERROR', 'Unknown error', {})
    }
  } catch (error) {
    console.error('Error creating chat:', error)
    throw error
  }
}

const getLoginedUsersCollection = async (token: string): Promise<ChatEntity[]> => {
  const client = hcClient({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const res = await client['user-privates']['chats'].$get()
  const json = await res.json()

  if (!('data' in json)) throw new Error('Failed to fetch chat collection')
  const data = json.data as any[]

  return data.map((chat) => ({
    ...chat,
    updatedAt: new Date(chat.updatedAt),
    createdAt: new Date(chat.createdAt),
  }))
}

export const chatRepository = {
  getLoginedUsersCollection,
  get,
  create,
}

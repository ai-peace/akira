import { hcClient } from '@/api-client/hc.api-client'
import { ChatEntity } from '@/domains/entities/chat.entity'
import { HcApiError } from '@/domains/errors/frontend.error'
import type { InferRequestType } from 'hono/client'

const client = hcClient()
export type CreateChatInput = InferRequestType<typeof client.chats.$post>

const get = async (uniqueKey: string): Promise<ChatEntity | null> => {
  try {
    const client = hcClient()
    const res = await client.chats[':uniqueKey'].$get({ param: { uniqueKey } })
    const json = await res.json()

    if (res.ok && 'data' in json) {
      const data = json.data as ChatEntity
      return {
        ...data,
        updatedAt: new Date(data.updatedAt),
        createdAt: new Date(data.createdAt),
        promptGroups: (data.promptGroups ?? []).map((promptGroup) => ({
          ...promptGroup,
          updatedAt: new Date(promptGroup.updatedAt),
          createdAt: new Date(promptGroup.createdAt),
          prompts: (promptGroup.prompts ?? []).map((prompt) => ({
            ...prompt,
            llmStatusChangeAt: prompt.llmStatusChangeAt
              ? new Date(prompt.llmStatusChangeAt)
              : undefined,
            updatedAt: new Date(prompt.updatedAt),
            createdAt: new Date(prompt.createdAt),
          })),
        })),
      }
    }

    // エラーレスポンスの場合
    if ('error' in json) {
      throw new HcApiError(
        json.error?.code ?? 'UNKNOWN_ERROR',
        json.error?.message ?? 'Unknown error',
      )
    }

    // 不正なレスポンス形式の場合
    throw new HcApiError('UNKNOWN_ERROR', 'Invalid response format')
  } catch (error) {
    console.error('Error fetching chat:', error)
    if (error instanceof HcApiError) {
      throw error // 既にHcApiError形式の場合はそのまま再スロー
    }
    throw new HcApiError('SERVER_ERROR', 'Failed to fetch chat')
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
  try {
    const client = hcClient({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const res = await client['user-privates']['chats'].$get()
    const json = await res.json()

    if (res.ok && 'data' in json) {
      const data = json.data as unknown as ChatEntity[]
      return data.map((chat) => ({
        ...chat,
        updatedAt: new Date(chat.updatedAt),
        createdAt: new Date(chat.createdAt),
        promptGroups: (chat.promptGroups ?? []).map((promptGroup) => ({
          ...promptGroup,
          updatedAt: new Date(promptGroup.updatedAt),
          createdAt: new Date(promptGroup.createdAt),
        })),
      }))
    }

    if ('error' in json) {
      throw new HcApiError(
        json.error?.code ?? 'UNKNOWN_ERROR',
        json.error?.message ?? 'Unknown error',
      )
    }

    throw new HcApiError('UNKNOWN_ERROR', 'Invalid response format')
  } catch (error) {
    console.error('Error fetching chat collection:', error)
    if (error instanceof HcApiError) {
      throw error
    }
    throw new HcApiError('SERVER_ERROR', 'Failed to fetch chat collection')
  }
}

export const chatRepository = {
  getLoginedUsersCollection,
  get,
  create,
}

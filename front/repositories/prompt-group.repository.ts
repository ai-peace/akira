import { hcClient } from '@/front/api-client/hc.api-client'
import { PromptGroupEntity } from '@/common/domains/entities/prompt-group.entity'
import { HcApiError } from '@/common/domains/errors/frontend.error'
import type { InferRequestType } from 'hono/client'

const client = hcClient()

export type CreateChatPromptGroupInput = InferRequestType<
  (typeof client.chats)[':uniqueKey']['prompt-groups']['$post']
>

const get = async (uniqueKey: string): Promise<PromptGroupEntity | null> => {
  const res = await client['prompt-groups'][':uniqueKey'].$get({
    param: {
      uniqueKey: uniqueKey,
    },
  })
  const json = await res.json()

  if (res.ok && 'data' in json) {
    return json.data as PromptGroupEntity
  }

  if ('error' in json) {
    throw new HcApiError(json.error?.code ?? 'UNKNOWN_ERROR', json.error?.message ?? '', json.error)
  }

  throw new HcApiError('UNKNOWN_ERROR', 'Unknown error', {})
}

const create = async (input: CreateChatPromptGroupInput, token: string) => {
  const client = hcClient({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const res = await client.chats[':uniqueKey']['prompt-groups'].$post({
    json: input.json,
    param: {
      uniqueKey: input.param.uniqueKey,
    },
  })
  const json = await res.json()

  if (res.ok && 'data' in json) {
    return json.data as PromptGroupEntity
  }

  if ('error' in json) {
    throw new HcApiError(json.error?.code ?? 'UNKNOWN_ERROR', json.error?.message ?? '', json.error)
  }

  throw new HcApiError('UNKNOWN_ERROR', 'Unknown error', {})
}

// NOTE 検証中のため本来honoで作成するtypeやschemaを使用していない
const createVoiceChatPromptGroup = async (
  audioBlob: Blob,
  chatUniqueKey: string,
  token: string,
) => {
  const formData = new FormData()
  formData.append('audio', audioBlob)

  // Honoクライアントではなく直接fetchを使用
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  const res = await fetch(`${baseUrl}/api/voice-chats/${chatUniqueKey}/prompt-groups`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const json = await res.json()

  if (res.ok && 'data' in json) {
    return json.data as PromptGroupEntity
  }
}

export const promptGroupRepository = {
  get,
  create,
  createVoiceChatPromptGroup,
}

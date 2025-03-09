import { hcClient } from '@/api-client/hc.api-client'
import { PromptGroupEntity } from '@/domains/entities/prompt-group.entity'
import { HcApiError } from '@/domains/error-codes/index.error-codes'
import type { InferRequestType } from 'hono/client'

const client = hcClient()

export type CreateChatPromptGroupInput = InferRequestType<
  (typeof client.chats)[':uniqueKey']['prompt-groups']['$post']
>

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
  } else if (!res.ok && 'error' in json) {
    const error = json.error
    throw new HcApiError(json.error?.code ?? 'UNKNOWN_ERROR', json.error?.message ?? '', json.error)
  } else {
    throw new HcApiError('UNKNOWN_ERROR', 'Unknown error', {})
  }
}

export const promptGroupRepository = {
  create,
}

import { hcClient } from '@/api-client/hc.api-client'
import type { InferRequestType } from 'hono/client'

const client = hcClient()

export type CreateChatPromptGroupInput = InferRequestType<
  (typeof client.chats)[':uniqueKey']['prompt-groups']['$post']
>

const create = async (input: CreateChatPromptGroupInput) => {
  const client = hcClient()
  const res = await client.chats[':uniqueKey']['prompt-groups'].$post({
    json: input.json,
    param: {
      uniqueKey: input.param.uniqueKey,
    },
  })
  const json = await res.json()

  if (!('data' in json)) throw new Error('Failed to create prompt group')

  return json.data
}

export const promptGroupRepository = {
  create,
}

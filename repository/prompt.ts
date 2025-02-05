import { hcClient } from '@/api-client/hc.api-client'
import type { InferRequestType } from 'hono/client'

const client = hcClient()

export type CreateChatPromptInput = InferRequestType<
  (typeof client.chats)[':uniqueKey']['prompts']['$post']
>

const createInChat = async (input: CreateChatPromptInput) => {
  const client = hcClient()
  const res = await client.chats[':uniqueKey'].prompts.$post({
    json: input.json,
    param: {
      uniqueKey: input.param.uniqueKey,
    },
  })
  const json = await res.json()

  if (!('data' in json)) throw new Error('Failed to create chat')

  return json.data
}

export const promptRepository = {
  createInChat,
}

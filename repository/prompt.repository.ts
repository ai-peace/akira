import { hcClient } from '@/api-client/hc.api-client'
import { PromptEntity } from '@/domains/entities/prompt.entity'
import type { InferRequestType } from 'hono/client'

const client = hcClient()
export type GetPromptInput = InferRequestType<(typeof client.prompts)[':uniqueKey']['$get']>
export type CreatePromptInput = InferRequestType<
  (typeof client.documents)[':uniqueKey']['prompts']['$post']
>
export type ListDocumentPromptsInput = InferRequestType<
  (typeof client.documents)[':uniqueKey']['prompts']['$get']
>

const get = async (input: GetPromptInput): Promise<PromptEntity> => {
  const res = await client.prompts[':uniqueKey']['$get']({
    param: { uniqueKey: input.param.uniqueKey },
  })

  const json = await res.json()
  if ('data' in json) {
    return json.data as PromptEntity
  }

  throw new Error('Failed to fetch prompt')
}

const create = async (input: CreatePromptInput): Promise<PromptEntity> => {
  try {
    const client = hcClient()
    const res = await client.documents[':uniqueKey'].prompts['$post']({
      param: { uniqueKey: input.param.uniqueKey },
      json: input.json,
    })
    const json = await res.json()

    if ('data' in json) {
      return json.data as PromptEntity
    }
    throw new Error('Failed to create prompt')
  } catch (error) {
    console.error('Error creating prompt:', error)
    throw error
  }
}

const listByDocument = async (documentUniqueKey: string): Promise<PromptEntity[]> => {
  const res = await client.documents[':uniqueKey'].prompts['$get']({
    param: { uniqueKey: documentUniqueKey },
  })
  const json = await res.json()
  if ('data' in json) {
    return json.data as PromptEntity[]
  }
  throw new Error('Failed to fetch prompts for document')
}

export const promptRepository = {
  get,
  create,
  listByDocument,
}

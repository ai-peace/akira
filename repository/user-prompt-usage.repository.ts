import { hcClient } from '@/api-client/hc.api-client'
import { UserPromptUsageEntity } from '@/domains/entities/user-prompt-usage.entity'

const get = async (token: string): Promise<UserPromptUsageEntity | null> => {
  const client = hcClient({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const res = await client['user-prompt-usages'].$post()
  const json = await res.json()

  if ('data' in json) {
    const data = {
      ...json.data,
      date: new Date(json.data.date),
    } as UserPromptUsageEntity

    return data
  } else {
    return null
  }
}

const upsert = async (
  token: string,
  data: UserPromptUsageEntity,
): Promise<UserPromptUsageEntity> => {
  const client = hcClient({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const res = await client['user-prompt-usages'].$patch({
    json: data,
  })

  const json = await res.json()

  if ('data' in json) {
    const data = {
      ...json.data,
      date: new Date(json.data.date),
    } as UserPromptUsageEntity

    return data
  } else {
    throw new Error('Failed to upsert user prompt usage')
  }
}

export const userPromptUsageRepository = {
  get,
  upsert,
}

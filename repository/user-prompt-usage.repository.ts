import { hcClient } from '@/api-client/hc.api-client'
import { UserPromptUsageEntity } from '@/domains/entities/user-prompt-usage.entity'
import { HcApiError } from '@/domains/errors/frontend.error'

const get = async (token: string): Promise<UserPromptUsageEntity | null> => {
  const client = hcClient({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const res = await client['user-prompt-usages'].$post()
  const json = await res.json()

  if ('data' in json) {
    const responseData = json.data as UserPromptUsageEntity
    const data = {
      ...responseData,
      date: new Date(responseData.date),
    }
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
  }

  if ('error' in json) {
    const error = json.error as HcApiError
    throw new HcApiError(error.code ?? 'UNKNOWN_ERROR', error.message ?? 'Unknown error')
  }

  throw new HcApiError('UNKNOWN_ERROR', 'Unknown error', {})
}

export const userPromptUsageRepository = {
  get,
  upsert,
}

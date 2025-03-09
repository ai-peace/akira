import { hcClient } from '@/api-client/hc.api-client'
import { UserPrivateEntity } from '@/domains/entities/user-private.entity'
import { HcApiError } from '@/domains/errors/frontend.error'

const get = async (token: string): Promise<UserPrivateEntity | null> => {
  const client = hcClient({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const res = await client['user-privates'].$get()
  const json = await res.json()

  if ('data' in json) {
    const data = json.data as UserPrivateEntity
    return {
      ...data,
    }
  } else {
    return null
  }
}

const create = async (token: string): Promise<UserPrivateEntity | null> => {
  const client = hcClient({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const res = await client.users.$post()
  const json = await res.json()

  if ('data' in json) {
    const data = json.data as UserPrivateEntity
    return {
      ...data,
    }
  }

  if ('error' in json) {
    throw new HcApiError(
      json.error?.code ?? 'UNKNOWN_ERROR',
      json.error?.message ?? 'Unknown error',
    )
  }

  throw new HcApiError('UNKNOWN_ERROR', 'Unknown error', {})
}

const update = async (token: string, data: UserPrivateEntity): Promise<UserPrivateEntity> => {
  try {
    const client = hcClient({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const res = await client.users.$patch({
      json: data,
    })
    const json = await res.json()

    if ('data' in json) {
      const data = json.data as UserPrivateEntity
      return {
        ...data,
      }
    }

    if ('error' in json) {
      throw new HcApiError(
        json.error?.code ?? 'UNKNOWN_ERROR',
        json.error?.message ?? 'Unknown error',
      )
    }

    throw new HcApiError('UNKNOWN_ERROR', 'Unknown error', {})
  } catch (error) {
    console.error('Error updating user private:', error)
    throw error
  }
}

export const userPrivateRepository = {
  get,
  create,
  update,
}

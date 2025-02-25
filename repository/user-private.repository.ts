import { hcClient } from '@/api-client/hc.api-client'
import { UserPrivateEntity } from '@/domains/entities/user-private.entity'

const get = async (token: string): Promise<UserPrivateEntity | null> => {
  const client = hcClient({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const res = await client.users.$get()
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
  } else {
    return null
  }
}

export const userPrivateRepository = {
  get,
  create,
}

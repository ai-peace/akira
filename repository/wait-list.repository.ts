import { WaitListEntity } from '@/domains/entities/wait-list.entity'
import { HcApiError } from '@/domains/errors/frontend.error'
import { hcClient } from '@/api-client/hc.api-client'
import { InferRequestType } from 'hono/client'

const client = hcClient()

export type CreateWaitListInput = InferRequestType<(typeof client)['wait-lists']['$post']>

export const waitListRepository = {
  create: async (params: {
    json: {
      email: string
    }
  }): Promise<WaitListEntity> => {
    const response = await client['wait-lists'].$post({
      json: params.json,
    })
    const json = await response.json()
    if (response.ok && 'data' in json) {
      return json.data as WaitListEntity
    }

    if ('error' in json) {
      throw new HcApiError(
        json.error?.code ?? 'UNKNOWN_ERROR',
        json.error?.message ?? 'Unknown error',
      )
    }

    throw new HcApiError('UNKNOWN_ERROR', 'Unknown error', {})
  },
}

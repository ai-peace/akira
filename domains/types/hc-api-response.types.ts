import { ServerErrorCode } from '../error-codes/server.error-codes'

// types/api.types.ts
export type HcApiResponse<T> = {
  data?: T
  error?: HcApiError
}

export type HcApiError = {
  code: ServerErrorCode
  message: string
  details?: Record<string, unknown>
}

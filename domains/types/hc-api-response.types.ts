import { ServerErrorCode } from '../error-codes/server.error-codes'

// サーバーサイドで利用するサーバーエラー型
export type HcApiErrorType = {
  code: ServerErrorCode
  message: string
  details?: Record<string, unknown>
}

// types/api.types.ts
export type HcApiResponseType<T> = {
  data?: T
  error?: HcApiErrorType
}

import { ServerErrorCode } from './server.error-codes'

export type HcApiError = {
  code: ServerErrorCode
  message: string
  details?: Record<string, unknown>
}

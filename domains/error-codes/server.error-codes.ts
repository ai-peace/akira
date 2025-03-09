import { HcApiErrorType } from './index.error-codes'

export type ServerErrorCode = (typeof serverErrorCodes)[keyof typeof serverErrorCodes]

export const serverErrorCodes = {
  SERVER_ERROR: 'SERVER_ERROR',
  DAILY_PROMPT_USAGE_LIMIT_EXCEEDED: 'DAILY_PROMPT_USAGE_LIMIT_EXCEEDED',
  NOT_FOUND: 'NOT_FOUND',
} as const

export const serverErrorMessages = {
  [serverErrorCodes.SERVER_ERROR]: {
    en: 'Server error',
  },
  [serverErrorCodes.DAILY_PROMPT_USAGE_LIMIT_EXCEEDED]: {
    en: 'Daily usage limit exceeded',
  },
  [serverErrorCodes.NOT_FOUND]: {
    en: 'Not found',
  },
} as const

export const createServerAppError = (
  code: ServerErrorCode,
  details?: Record<string, unknown>,
): HcApiErrorType => {
  return {
    code,
    message: serverErrorMessages[code].en,
    details,
  }
}

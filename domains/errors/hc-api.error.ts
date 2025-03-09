// response type
export type HcApiErrorType = {
  code: HcApiErrorCode
  message: string
  details?: Record<string, unknown>
}

export type HcApiResponseType<T> = {
  data?: T
  error?: HcApiErrorType
}

// error code
export type HcApiErrorCode = (typeof hcApiErrorCodes)[keyof typeof hcApiErrorCodes]

export const hcApiErrorCodes = {
  SERVER_ERROR: 'SERVER_ERROR',
  DAILY_PROMPT_USAGE_LIMIT_EXCEEDED: 'DAILY_PROMPT_USAGE_LIMIT_EXCEEDED',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export const hcApiErrorMessages = {
  [hcApiErrorCodes.SERVER_ERROR]: {
    en: 'Server error',
  },
  [hcApiErrorCodes.DAILY_PROMPT_USAGE_LIMIT_EXCEEDED]: {
    en: 'Daily usage limit exceeded',
  },
  [hcApiErrorCodes.NOT_FOUND]: {
    en: 'Not found',
  },
  [hcApiErrorCodes.UNKNOWN_ERROR]: {
    en: 'Unknown error',
  },
} as const

// error constructor
export const createHcApiError = (
  code: HcApiErrorCode,
  details?: Record<string, unknown>,
): HcApiErrorType => {
  return {
    code,
    message: hcApiErrorMessages[code].en,
    details,
  }
}

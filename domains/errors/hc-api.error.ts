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
  UNAUTHORIZED: 'UNAUTHORIZED',
  VERIFICATION_ERROR: 'VERIFICATION_ERROR',
  CHECK_USER_PROMPT_USAGE_ERROR: 'CHECK_USER_PROMPT_USAGE_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  DAILY_PROMPT_USAGE_LIMIT_EXCEEDED: 'DAILY_PROMPT_USAGE_LIMIT_EXCEEDED',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export const hcApiErrorMessages = {
  [hcApiErrorCodes.UNAUTHORIZED]: {
    en: () => 'Unauthorized',
  },
  [hcApiErrorCodes.VERIFICATION_ERROR]: {
    en: () => 'Verification error',
  },
  [hcApiErrorCodes.CHECK_USER_PROMPT_USAGE_ERROR]: {
    en: () => 'Check user prompt usage error',
  },
  [hcApiErrorCodes.SERVER_ERROR]: {
    en: () => 'Server error',
  },
  [hcApiErrorCodes.DAILY_PROMPT_USAGE_LIMIT_EXCEEDED]: {
    en: () => 'Daily usage limit exceeded',
  },
  [hcApiErrorCodes.NOT_FOUND]: {
    en: (payload?: Record<string, unknown>) => `Not found: ${payload?.resource}`,
  },
  [hcApiErrorCodes.UNKNOWN_ERROR]: {
    en: () => 'Unknown error',
  },
} as const

// error constructor
export const createHcApiError = (
  code: HcApiErrorCode,
  payload?: Record<string, unknown>,
  details?: Record<string, unknown>,
): HcApiErrorType => {
  return {
    code,
    message: hcApiErrorMessages[code].en(payload),
    details,
  }
}

export const LLM_PROVIDERS = {
  OPENAI: 'openai',
  GEMINI: 'gemini',
  CLAUDE: 'claude',
} as const

export type LLMProvider = (typeof LLM_PROVIDERS)[keyof typeof LLM_PROVIDERS]

export type LLMMessage = {
  role: 'system' | 'user' | 'assistant'
  content:
    | string
    | {
        text?: string
        image?: {
          url: string
          mimeType: string
        }
      }
}

export type LLMRequest = {
  provider: LLMProvider
  messages: LLMMessage[]
  options?: {
    temperature?: number
    maxTokens?: number
    model?: string
  }
}

export type LLMResponse = {
  content: string | null
  error?: string
  metadata?: {
    provider: LLMProvider
    model?: string
    usage?: {
      promptTokens?: number
      completionTokens?: number
    }
  }
}

import { LLMResponseEntity } from './llm-response.entity'

export interface PromptEntity {
  uniqueKey: string
  result?: LLMResponseEntity
  resultType?: string
  llmStatus: string
  llmStatusChangeAt?: Date
  llmError?: string
  updatedAt: Date
  createdAt: Date
}

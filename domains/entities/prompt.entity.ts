export interface PromptEntity {
  uniqueKey: string
  result?: any
  resultType?: string
  llmStatus: string
  llmStatusChangeAt?: Date
  llmError?: string
  updatedAt: Date
  createdAt: Date
}

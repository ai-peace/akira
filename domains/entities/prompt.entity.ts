export interface PromptEntity {
  uniqueKey: string
  mainPrompt: string
  resultMdxContent?: string
  llmStatus: string
  llmStatusChangeAt?: Date
  llmError?: string
  updatedAt: Date
  createdAt: Date
}

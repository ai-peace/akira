export interface DocumentEntity {
  uniqueKey: string
  title?: string
  mdxContent?: string
  llmStatus: string
  llmStatusChangeAt: Date | undefined
  updatedAt: Date
  createdAt: Date
}

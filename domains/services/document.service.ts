import { DocumentEntity } from '@/domains/entities/document.entity'

const isGenerateSucceeded = (document: DocumentEntity) => document.llmStatus === 'SUCCESS'

export const documentService = {
  isGenerateSucceeded,
}

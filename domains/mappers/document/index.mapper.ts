import { Document } from '@prisma/client'
import { DocumentEntity } from '../../entities/document.entity'

export const documentMapper = {
  toDomain: (prismaDocument: Document): DocumentEntity => {
    return {
      uniqueKey: prismaDocument.uniqueKey,
      title: prismaDocument.title ?? '',
      mdxContent: prismaDocument.mdxContent ?? '',
      llmStatus: prismaDocument.llmStatus ?? '',
      llmStatusChangeAt: prismaDocument.llmStatusChangeAt
        ? new Date(prismaDocument.llmStatusChangeAt)
        : undefined,
      updatedAt: prismaDocument.updatedAt,
      createdAt: prismaDocument.createdAt,
    }
  },

  toDomainCollection: (prismaDocuments: Document[]): DocumentEntity[] => {
    return prismaDocuments.map(documentMapper.toDomain)
  },
}

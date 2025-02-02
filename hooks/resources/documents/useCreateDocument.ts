import { CreateDocumentInput, documentRepository } from '@/repository/document.repository'

export const useCreateDocument = () => {
  const createDocument = async (input: CreateDocumentInput) => {
    const response = await documentRepository.create(input)
    return response
  }

  return {
    createDocument,
  }
}

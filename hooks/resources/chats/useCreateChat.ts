import { CreateChatInput, chatRepository } from '@/repository/chat'

export const useCreateChat = () => {
  const createChat = async (input: CreateChatInput) => {
    const response = await chatRepository.create(input)
    return response
  }

  return {
    createChat,
  }
}

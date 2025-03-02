import { CreateChatInput, chatRepository } from '@/repository/chat.repository'
import { PrivyAccessTokenRepository } from '@/repository/privy-access-token.repository'

export const useCreateChat = () => {
  const createChat = async (input: CreateChatInput) => {
    const accessToken = await PrivyAccessTokenRepository.get()
    if (!accessToken) {
      throw new Error('Access token not found')
    }
    const response = await chatRepository.create(input, accessToken)
    return response
  }

  return {
    createChat,
  }
}

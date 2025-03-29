import { CreateChatInput, chatRepository } from '@/front/repositories/chat.repository'
import { PrivyAccessTokenRepository } from '@/front/repositories/privy-access-token.repository'

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

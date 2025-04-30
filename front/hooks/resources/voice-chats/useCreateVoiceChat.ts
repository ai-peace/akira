import { chatRepository } from '@/front/repositories/chat.repository'
import { PrivyAccessTokenRepository } from '@/front/repositories/privy-access-token.repository'

export const useCreateVoiceChat = () => {
  const createVoiceChat = async () => {
    try {
      const accessToken = await PrivyAccessTokenRepository.get()
      if (!accessToken) {
        throw new Error('アクセストークンが見つかりません')
      }

      const response = await chatRepository.createVoiceChat(accessToken)
      return response
    } catch (error) {
      console.error('音声チャット作成エラー:', error)
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('音声チャットの作成中に不明なエラーが発生しました')
      }
    }
  }

  return {
    createVoiceChat,
  }
}

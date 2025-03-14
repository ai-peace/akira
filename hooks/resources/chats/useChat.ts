import { ChatEntity } from '@/domains/entities/chat.entity'
import { chatRepository } from '@/repository/chat.repository'
import { PrivyAccessTokenRepository } from '@/repository/privy-access-token.repository'
import { promptGroupRepository } from '@/repository/prompt-group.repository'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

export const useChat = (variables: { uniqueKey: string }) => {
  const [errorType, setErrorType] = useState<string | undefined>()

  const { data, error, isLoading, mutate } = useSWR<ChatEntity | null>(
    [`chat/${variables.uniqueKey}`, variables],
    async () => {
      return await chatRepository.get(variables.uniqueKey)
    },
    {
      refreshInterval: 1000,
    },
  )

  // TODO ここでエラーをどうハンドリングするか。利用数が多いものはエラーを出す。
  useEffect(() => {
    if (!error) return
    if (`${error}`.includes('NotFoundError')) {
      setErrorType('NotFoundError')
    } else {
      setErrorType(`UnknownError ${error}`)
    }
  }, [error])

  const createChatPromptGroup = async (question: string) => {
    const accessToken = await PrivyAccessTokenRepository.get()
    if (!accessToken) throw new Error('Access token not found')
    const response = await promptGroupRepository.create(
      {
        json: {
          question,
        },
        param: {
          uniqueKey: variables.uniqueKey,
        },
      },
      accessToken,
    )
    mutate()
    return response
  }

  return {
    chat: data,
    chatError: error,
    chatIsLoading: isLoading,
    chatErrorType: errorType,
    createChatPromptGroup,
  }
}

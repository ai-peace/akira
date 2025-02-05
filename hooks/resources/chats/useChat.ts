import { ChatEntity } from '@/domains/entities/chat.entity'
import { chatRepository } from '@/repository/chat'
import { promptRepository } from '@/repository/prompt'
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

  useEffect(() => {
    if (!error) return
    if (`${error}`.includes('NotFoundError')) {
      setErrorType('NotFoundError')
    } else {
      setErrorType(`UnknownError ${error}`)
    }
  }, [error])

  const createChatPrompt = async (mainPrompt: string) => {
    const response = await promptRepository.createInChat({
      json: {
        mainPrompt,
      },
      param: {
        uniqueKey: variables.uniqueKey,
      },
    })
    mutate()
    return response
  }

  return {
    chat: data,
    chatError: error,
    chatIsLoading: isLoading,
    chatErrorType: errorType,
    createChatPrompt,
  }
}

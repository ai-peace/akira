import { ChatEntity } from '@/domains/entities/chat.entity'
import { chatRepository } from '@/repository/chat'
import { promptGroupRepository } from '@/repository/prompt-group'
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

  const createChatPromptGroup = async (question: string) => {
    const response = await promptGroupRepository.create({
      json: {
        question,
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
    createChatPromptGroup,
  }
}

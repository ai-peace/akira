import { ChatEntity } from '@/domains/entities/chat.entity'
import { chatRepository } from '@/repository/chat'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

export const useChat = (variables: { uniqueKey: string }) => {
  const [errorType, setErrorType] = useState<string | undefined>()

  const { data, error, isLoading } = useSWR<ChatEntity | null>(
    [`chat/${variables.uniqueKey}`, variables],
    async () => {
      return await chatRepository.get(variables.uniqueKey)
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

  return {
    chat: data,
    chatError: error,
    chatIsLoading: isLoading,
    chatErrorType: errorType,
  }
}

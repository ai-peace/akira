import { ChatEntity } from '@/domains/entities/chat.entity'
import { chatRepository } from '@/repository/chat.repository'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

export const useChats = () => {
  const [errorType, setErrorType] = useState<string | undefined>()

  const { data, error, isLoading } = useSWR<ChatEntity[]>([`chats`], async () => {
    return await chatRepository.getCollection()
  })

  useEffect(() => {
    if (!error) return
    if (`${error}`.includes('NotFoundError')) {
      setErrorType('NotFoundError')
    } else {
      setErrorType(`UnknownError ${error}`)
    }
  }, [error])

  return {
    chats: data,
    chatsError: error,
    chatsIsLoading: isLoading,
    chatsErrorType: errorType,
  }
}

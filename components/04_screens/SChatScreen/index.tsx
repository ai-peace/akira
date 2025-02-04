'use client'
import { useChat } from '@/hooks/resources/chats/useChat'
import { FC } from 'react'

type Props = {
  chatUniqueKey: string
}

const Component: FC<Props> = ({ chatUniqueKey }) => {
  const { chat, chatError, chatIsLoading, chatErrorType } = useChat({ uniqueKey: chatUniqueKey })

  if (chatIsLoading) return <div>Loading...</div>
  if (chatError) return <div>Error: {chatError.message}</div>

  return (
    <>
      <div>{chat?.uniqueKey}</div>
      <div>{chat?.mdxContent}</div>
    </>
  )
}

export { Component as SChatScreen }

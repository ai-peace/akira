'use client'

import { ECenteredLoadingSpinner } from '@/front/components/01_elements/ECenteredLoadingSpinner'
import { OChatHistorySection } from '@/front/components/02_organisms/OChatHistorySection'
import { TChatMessageContent } from '@/front/components/03_templates/TChatMessageContent'
import { useChat } from '@/front/hooks/resources/chats/useChat'
import { FC, useState } from 'react'

type Props = {
  chatUniqueKey: string
}

const Component: FC<Props> = ({ chatUniqueKey }) => {
  const { chat, chatError, chatIsLoading, createChatPromptGroup } = useChat({
    uniqueKey: chatUniqueKey,
  })
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null)

  const handleIntersect = (promptGroupId: string) => {
    setCurrentPromptId(promptGroupId)
  }

  if (chatIsLoading)
    return (
      <div className="relative flex h-full w-full">
        <ECenteredLoadingSpinner />
      </div>
    )
  if (!chat) return <div>Chat not found</div>
  if (chatError) return <div>Error: {chatError.message}</div>

  return (
    <>
      <div className="relative flex h-full w-full">
        <TChatMessageContent
          promptGroups={chat.promptGroups}
          createChatPromptGroup={createChatPromptGroup}
          onIntersect={handleIntersect}
        />
        <OChatHistorySection chat={chat} currentPromptId={currentPromptId} />
      </div>
    </>
  )
}

export { Component as SChatScreen }

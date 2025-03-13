import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble'
import { FC } from 'react'

type Props = {
  question: string
}

const Component: FC<Props> = ({ question }) => {
  return (
    <>
      <div className="flex justify-end">
        <ChatBubble variant="sent">
          <ChatBubbleAvatar fallback="Y" />
          <ChatBubbleMessage variant="sent" className="text-sm md:text-base">
            {question}
          </ChatBubbleMessage>
        </ChatBubble>
      </div>
      <ChatBubble variant="received">
        <ChatBubbleAvatar fallback="AI" />
        <ChatBubbleMessage isLoading className="text-sm md:text-base" />
      </ChatBubble>
    </>
  )
}

export { Component as EOptimisticPromptGroup }

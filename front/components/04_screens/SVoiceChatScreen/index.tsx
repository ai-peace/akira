'use client'

import { ECenteredLoadingSpinner } from '@/front/components/01_elements/ECenteredLoadingSpinner'
import { OChatHistorySection } from '@/front/components/02_organisms/OChatHistorySection'
import { useChat } from '@/front/hooks/resources/chats/useChat'
import { useRecording } from '@/front/hooks/useRecording'
import { handleError } from '@/front/util/error-handler.helper'
import { Mic, Clock } from 'lucide-react'
import Image from 'next/image'
import { FC, useState, useEffect, useRef } from 'react'
import { TVoiceChatMessageContent } from '../../03_templates/TVoiceChatMessageContent'

type Props = {
  chatUniqueKey: string
}

const Component: FC<Props> = ({ chatUniqueKey }) => {
  const { chat, chatError, chatIsLoading, createChatPromptGroup } = useChat({
    uniqueKey: chatUniqueKey,
  })
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null)
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleIntersect = (promptGroupId: string) => {
    setCurrentPromptId(promptGroupId)
  }

  const { isRecording, startRecording, stopRecording } = useRecording(chatUniqueKey)

  // レスポンスが返ってきたらwaitingステータスをリセット
  useEffect(() => {
    if (isWaitingForResponse && chat && chat.promptGroups && chat.promptGroups.length > 0) {
      const latestPromptGroup = chat.promptGroups[chat.promptGroups.length - 1]
      if (latestPromptGroup.prompts.some((prompt) => prompt.llmStatus === 'SUCCESS')) {
        setIsWaitingForResponse(false)
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    }
  }, [chat, isWaitingForResponse])

  // 3000ms後に自動的にwaitingステータスをリセット
  useEffect(() => {
    if (isWaitingForResponse) {
      timerRef.current = setTimeout(() => {
        setIsWaitingForResponse(false)
      }, 3000)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isWaitingForResponse])

  const handleSubmit = async () => {
    try {
      if (isRecording) {
        await stopRecording()
        setIsWaitingForResponse(true)
      } else {
        await startRecording()
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      setIsWaitingForResponse(false)
      handleError(error, {
        description:
          'AKIRA has reached its user limit. Please register for the waitlist if you would like to join.',
      })
    }
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
        <TVoiceChatMessageContent
          promptGroups={chat.promptGroups}
          createChatPromptGroup={createChatPromptGroup}
          onIntersect={handleIntersect}
        />
        <OChatHistorySection chat={chat} currentPromptId={currentPromptId} />

        {/* <div className="prose prose-invert absolute bottom-0 left-0 right-0 mx-auto h-full w-full max-w-[708px] px-4 pb-4 pt-4 prose-headings:text-foreground-strong prose-p:text-foreground prose-a:text-accent-1 prose-strong:text-foreground-strong prose-code:text-accent-1 prose-pre:bg-background-muted"> */}

        <div className="absolute left-0 right-0 top-16 flex w-full items-center justify-center px-4 md:top-4">
          <div className="flex w-full max-w-[708px] items-center rounded-full bg-primary shadow-xl shadow-primary/20">
            <div className="relative h-20 w-20">
              <Image
                src="/images/picture/picture_akira-kun.png"
                alt="AKIRA"
                fill
                className="my-0 object-cover p-2"
              />
            </div>
            <div className="ml-2 text-lg font-bold text-primary-foreground">Akira</div>
          </div>
        </div>

        {isWaitingForResponse && (
          <div className="absolute bottom-20 left-0 right-0 flex w-full items-center justify-center px-4">
            <div className="flex items-center gap-2 rounded-full bg-background-muted px-4 py-2 text-foreground shadow-md">
              <Clock className="h-5 w-5 animate-pulse" />
              <span className="animate-pulse">Waiting for response...</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-0 right-0 flex w-full items-center justify-center px-4">
          <button
            onClick={handleSubmit}
            className={`flex w-full max-w-[708px] cursor-pointer items-center justify-center gap-2 rounded-full p-4 transition-colors ${
              isRecording ? 'bg-red-500' : 'bg-primary text-primary-foreground'
            } shadow-lg`}
          >
            {isRecording ? (
              <>
                <Mic className="h-6 w-6 animate-pulse text-primary-foreground" />
                <div className="animate-pulse font-medium text-primary-foreground">
                  Recording...
                </div>
              </>
            ) : (
              <>
                <Mic className="h-6 w-6 text-primary-foreground" />
                <div className="font-medium text-primary-foreground">Ask to Akira</div>
              </>
            )}
          </button>
        </div>
        {/* </div> */}
      </div>
    </>
  )
}

export { Component as SVoiceChatScreen }

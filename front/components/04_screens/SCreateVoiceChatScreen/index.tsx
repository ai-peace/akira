'use client'

import { useCreateVoiceChat } from '@/front/hooks/resources/voice-chats/useCreateVoiceChat'
import { handleError } from '@/front/util/error-handler.helper'
import { voiceChatUrl } from '@/front/util/url.helper'
import { useRouter } from 'next/navigation'
import { FC, useEffect } from 'react'

// NOTE この画面は、VoiceChatを作成するための画面です。
const Component: FC = () => {
  const router = useRouter()
  const { createVoiceChat } = useCreateVoiceChat()

  const handleCreateVoiceChat = async () => {
    try {
      const voiceChat = await createVoiceChat()

      router.push(voiceChatUrl(voiceChat.uniqueKey))
    } catch (error) {
      console.error('Error creating chat:', error)
      handleError(error, {
        description:
          'AKIRA has reached its user limit. Please register for the waitlist if you would like to join.',
      })
    }
  }

  useEffect(() => {
    handleCreateVoiceChat()
  }, [])

  return <></>
}

export { Component as SCreateVoiceChatScreen }

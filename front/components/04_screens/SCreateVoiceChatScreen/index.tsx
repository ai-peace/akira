'use client'

import { useCreateVoiceChat } from '@/front/hooks/resources/voice-chats/useCreateVoiceChat'
import { handleError } from '@/front/util/error-handler.helper'
import { voiceChatUrl } from '@/front/util/url.helper'
import { LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useEffect } from 'react'
import { ProgressBar } from '@/front/components/ui/progress-bar'
import Image from 'next/image'
import { usePrivy } from '@privy-io/react-auth'

// NOTE この画面は、VoiceChatを作成するための画面です。
const Component: FC = () => {
  const { ready, authenticated } = usePrivy()
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
    if (!ready || !authenticated) return
    handleCreateVoiceChat()
  }, [ready, authenticated])

  return (
    <>
      {ready && authenticated ? (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-3">
          <div className="relative mb-2 h-20 w-20">
            <Image
              src="/images/picture/picture_akira-kun.png"
              alt="AKIRA"
              fill
              className="object-cover"
            />
          </div>
          <ProgressBar className="w-60" variant="primary" />
          <div className="mt-1 text-sm text-foreground-strong">
            <span>Connecting to AKIRA...</span>
          </div>
        </div>
      ) : (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-3">
          <div className="text-sm text-foreground-strong">
            <span>Please login to continue</span>
          </div>
        </div>
      )}
    </>
  )
}

export { Component as SCreateVoiceChatScreen }

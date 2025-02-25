'use client'

import EDotFont from '@/components/01_elements/EDotFont'
import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { TCreateDocumentForm } from '@/components/03_templates/TCreateDocumentForm'
import { useCreateChat } from '@/hooks/resources/chats/useCreateChat'
import { getChatUrl } from '@/utils/url.helper'
import { useRouter } from 'next/navigation'
import { FC } from 'react'

const Component: FC = () => {
  const router = useRouter()
  const { createChat } = useCreateChat()

  const handleSubmit = async (prompt: string) => {
    try {
      const chat = await createChat({
        json: {
          mainPrompt: prompt,
        },
      })

      router.push(getChatUrl(chat.uniqueKey))
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error // 再スローしてフォーム側でハンドリング可能に
    }
  }

  return (
    <div className="prose prose-invert mx-auto h-full w-full max-w-[708px] px-4 prose-headings:text-foreground-strong prose-p:text-foreground prose-a:text-accent-1 prose-strong:text-foreground-strong prose-code:text-accent-1 prose-pre:bg-background-muted">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="w-full">
          <div className="flex-none py-6 text-center">
            <h1 className="mb-0 text-3xl font-semibold text-white">
              <EDotFont
                text="What rare item are you looking for?"
                className="font-[400]"
                animate={true}
              />
              {/* <ETypewriterText text="What rare item are you looking for?" delay={0} /> */}
            </h1>
          </div>
          <div className="flex-grow">
            <TCreateDocumentForm onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  )
}

export { Component as SCreateDocumentScreen }

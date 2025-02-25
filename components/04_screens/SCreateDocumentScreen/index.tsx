'use client'

import EDotFont from '@/components/01_elements/EDotFont'
import ELogoAkira from '@/components/01_elements/ELogoAkira'
import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { TCreateDocumentForm } from '@/components/03_templates/TCreateDocumentForm'
import { useCreateChat } from '@/hooks/resources/chats/useCreateChat'
import { getChatUrl } from '@/utils/url.helper'
import Image from 'next/image'
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
    <div className="prose prose-invert mx-auto h-full w-full max-w-[708px] px-4 pb-[80px] prose-headings:text-foreground-strong prose-p:text-foreground prose-a:text-accent-1 prose-strong:text-foreground-strong prose-code:text-accent-1 prose-pre:bg-background-muted">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="flex w-full flex-col items-center justify-center">
          <div className="relative mb-6 h-20 w-20">
            <Image
              src="/images/picture/picture_akira-kun.png"
              alt="AKIRA"
              fill
              className="object-cover"
            />
          </div>
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
      <div className="absolute left-0 right-0 top-4 flex items-center justify-center">
        <ELogoAkira
          className="fill-foreground dark:fill-foreground"
          width={150 / 1.75}
          height={63 / 1.75}
        />
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
        <EDotFont
          text="AKIRA - Japanese Rare Item Search Agent "
          className="font-[400] text-foreground-strong"
          animate={true}
          delay={200}
        />
      </div>
    </div>
  )
}

export { Component as SCreateDocumentScreen }

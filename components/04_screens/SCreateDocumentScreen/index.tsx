'use client'

import { TCreateDocumentForm } from '@/components/03_templates/TCreateDocumentForm'
import { useCreateDocument } from '@/hooks/resources/documents/useCreateDocument'
import { getDocumentUrl } from '@/utils/url.helper'
import { useRouter } from 'next/navigation'
import { FC } from 'react'

const Component: FC = () => {
  const router = useRouter()
  const { createDocument } = useCreateDocument()

  const handleSubmit = async (prompt: string) => {
    try {
      const document = await createDocument({
        json: {
          projectUniqueKey: 'a',
          agentUniqueKey: 'b',
          setting: {
            prompt,
          },
        },
      })

      router.push(getDocumentUrl(document.uniqueKey))
    } catch (error) {
      console.error('ドキュメント作成エラー:', error)
      throw error // 再スローしてフォーム側でハンドリング可能に
    }
  }

  return (
    <div className="prose prose-invert mx-auto h-full w-full max-w-[708px] px-4 prose-headings:text-foreground-strong prose-p:text-foreground prose-a:text-accent-1 prose-strong:text-foreground-strong prose-code:text-accent-1 prose-pre:bg-background-muted">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="w-full">
          <div className="flex-none py-6 text-center">
            <h1 className="mb-0 text-3xl font-semibold text-white">
              What rare item are you looking for?
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

'use client'

import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { ORecommendKeywordListItemCollection } from '@/components/02_organisms/ORecommendKeywordListItem/collection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RecommendKeywordEntity } from '@/domains/entities/recommend-keyword.entity'
import { recommendKeywords } from '@/domains/mocks/recommend-keywords'
import { cn } from '@/lib/utils'
import { PrivyAccessTokenRepository } from '@/repository/privy-access-token.repository'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowUp, Loader2 } from 'lucide-react'
import { FC, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const topPageKeywords = [
  'Jujutsu Kaisen', // 呪術廻戦
  'One Piece', // ワンピース
  'My Hero Academia', // 僕のヒーローアカデミア
  'Chainsaw Man', // チェンソーマン
  'Spy x Family', // スパイファミリー
  'Demon Slayer: Kimetsu no Yaiba', // 鬼滅の刃
  'Blue Lock', // ブルーロック（別誌だがアメリカで人気）
  'Dr. Stone', // ドクターストーン
  'Mashle: Magic and Muscles', // マッシュル-MASHLE-
  'Undead Unluck', // アンデッドアンラック
  'Kaiju No. 8', // 怪獣8号
  'Mission: Yozakura Family', // 夜桜さんちの大作戦
  'Sakamoto Days', // サカモトデイズ
  'Black Clover', // ブラッククローバー
  'Dandadan', // ダンダダン（別誌だけど超人気）
  'The Elusive Samurai', // 逃げ上手の若君
  'Fabricant 100', // ファブリカント100
  'Akane-banashi', // あかね噺
  'Kill Blue', // キルブルー
  'Cipher Academy', // 暗号学園のいろは
]

const formSchema = z.object({
  prompt: z.string().min(1, 'プロンプトを入力してください'),
})

type FormData = z.infer<typeof formSchema>

type Props = {
  onSubmit: (prompt: string) => Promise<void>
}

const Component: FC<Props> = ({ onSubmit }) => {
  const [textareaHeight, setTextareaHeight] = useState('auto')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lineHeight = 24
  const { login } = usePrivy()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  })

  const handleSubmit = async (data: FormData) => {
    try {
      const accessToken = await PrivyAccessTokenRepository.get()
      if (!accessToken) {
        login()
        return
      }
      setIsSubmitting(true)
      await onSubmit(data.prompt)
      form.reset()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeywordClick = (keyword: RecommendKeywordEntity) => {
    form.setValue('prompt', keyword.value.en)
    const textareaElement = document.querySelector('textarea')
    if (textareaElement) {
      textareaElement.style.height = 'auto'
      const maxHeight = lineHeight * 18
      const newHeight = Math.min(textareaElement.scrollHeight, maxHeight)
      textareaElement.style.height = `${newHeight}px`
      setTextareaHeight(`${newHeight}px`)
    }
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex h-full flex-col">
        <div
          className={cn(
            'border-border-muted relative w-full flex-grow rounded-lg border bg-background-muted p-4',
            isSubmitting && 'opacity-20',
          )}
        >
          <Textarea
            {...form.register('prompt')}
            placeholder="Dragon Ball cel animation"
            onChange={(e) => {
              form.setValue('prompt', e.target.value)
              e.target.style.height = 'auto'
              const maxHeight = lineHeight * 18
              const newHeight = Math.min(e.target.scrollHeight, maxHeight)
              e.target.style.height = `${newHeight}px`
              setTextareaHeight(`${newHeight}px`)
            }}
            className={
              'min-h-[24px] w-full resize-none border-0 bg-transparent p-0 pb-12 text-lg text-foreground-strong shadow-none focus-visible:ring-0'
            }
            style={{
              overflow: parseInt(textareaHeight) >= lineHeight * 18 ? 'auto' : 'hidden',
              lineHeight: '24px',
              height: textareaHeight,
            }}
            disabled={isSubmitting}
          />
          {form.formState.errors.prompt && (
            <p className="mt-1 text-sm text-red-500">{form.formState.errors.prompt.message}</p>
          )}

          {/* 下部のボタングループ */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex gap-2" />

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                className="rounded-lg bg-foreground px-4 py-2 hover:bg-foreground/80"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <ORecommendKeywordListItemCollection
          keywords={recommendKeywords}
          isSubmitting={isSubmitting}
          onClick={handleKeywordClick}
          className="mt-4"
        />
      </form>
    </>
  )
}

export { Component as TCreateDocumentForm }

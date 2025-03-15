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
import { ArrowUp, ChevronLeft, Loader2 } from 'lucide-react'
import { FC, useState, useEffect } from 'react'
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
  const [currentKeywords, setCurrentKeywords] =
    useState<RecommendKeywordEntity[]>(recommendKeywords)
  const [parentKeyword, setParentKeyword] = useState<RecommendKeywordEntity | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const lineHeight = isMobile ? 18 : 24 // モバイルでは行の高さを小さく
  const { login } = usePrivy()

  // 画面サイズの変更を検知
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768) // 768px未満をモバイルとみなす
    }

    // 初期チェック
    checkIfMobile()

    // リサイズイベントのリスナーを追加
    window.addEventListener('resize', checkIfMobile)

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

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
      // 高さをリセット
      setTextareaHeight('auto')
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeywordClick = (keyword: RecommendKeywordEntity) => {
    if (keyword.children && keyword.children.length > 0) {
      setParentKeyword(keyword)
      setCurrentKeywords(keyword.children)
    } else {
      form.setValue('prompt', keyword.value.en)
      const textareaElement = document.querySelector('textarea')
      if (textareaElement) {
        textareaElement.style.height = 'auto'
        const maxHeight = lineHeight * (isMobile ? 12 : 18) // モバイルでは最大行数を減らす
        const newHeight = Math.min(textareaElement.scrollHeight, maxHeight)
        textareaElement.style.height = `${newHeight}px`
        setTextareaHeight(`${newHeight}px`)
      }
    }
  }

  const handleBackToParent = () => {
    setParentKeyword(null)
    setCurrentKeywords(recommendKeywords)
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex h-full flex-col">
        <div
          className={cn(
            'border-border-muted relative w-full flex-grow rounded-lg border bg-background-muted p-2 md:p-4',
            isSubmitting && 'opacity-20',
          )}
        >
          <Textarea
            {...form.register('prompt')}
            placeholder="Dragon Ball cel animation"
            onChange={(e) => {
              form.setValue('prompt', e.target.value)
              e.target.style.height = 'auto'
              const maxHeight = lineHeight * (isMobile ? 12 : 18) // モバイルでは最大行数を減らす
              const newHeight = Math.min(e.target.scrollHeight, maxHeight)
              e.target.style.height = `${newHeight}px`
              setTextareaHeight(`${newHeight}px`)
            }}
            className={
              'min-h-[24px] w-full resize-none border-0 bg-transparent p-1 pb-12 text-base text-foreground-strong shadow-none focus-visible:ring-0 md:text-lg'
            }
            style={{
              overflow:
                parseInt(textareaHeight) >= lineHeight * (isMobile ? 12 : 18) ? 'auto' : 'hidden',
              lineHeight: `${lineHeight}px`,
              height: textareaHeight,
              fontSize: isMobile ? '16px' : '', // iOSでの自動ズームを防止するために16px以上に設定
              touchAction: 'manipulation', // タッチ操作の最適化
              WebkitAppearance: 'none', // iOSのデフォルトスタイルを無効化
            }}
            disabled={isSubmitting}
            data-lpignore="true" // LastPassなどのフォーム自動入力を無効化
          />
          {form.formState.errors.prompt && (
            <p className="mt-1 text-xs text-red-500 md:text-sm">
              {form.formState.errors.prompt.message}
            </p>
          )}

          {/* 下部のボタングループ */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between md:bottom-4 md:left-4 md:right-4">
            <div className="flex gap-2" />

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                className="h-8 w-8 rounded-lg bg-foreground p-1 hover:bg-foreground/80 md:h-auto md:w-auto md:px-4 md:py-2"
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

        <div className="mt-4">
          {parentKeyword && (
            <div className="mb-3 flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToParent}
                className="flex items-center gap-1 text-xs"
              >
                <ChevronLeft size={14} />
                <span>Go back to the main category</span>
              </Button>
            </div>
          )}

          <ORecommendKeywordListItemCollection
            keywords={currentKeywords}
            isSubmitting={isSubmitting}
            onClick={handleKeywordClick}
          />
        </div>
      </form>
    </>
  )
}

export { Component as TCreateDocumentForm }

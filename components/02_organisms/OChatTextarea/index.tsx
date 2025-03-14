'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowUp } from 'lucide-react'
import { FC, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  prompt: z.string().min(1, 'プロンプトを入力してください'),
})

type FormData = z.infer<typeof formSchema>

type Props = {
  onSubmit: (prompt: string) => Promise<void>
}

const Component: FC<Props> = ({ onSubmit }) => {
  const [textareaHeight, setTextareaHeight] = useState('auto')
  const [isMobile, setIsMobile] = useState(false)
  const lineHeight = isMobile ? 18 : 24 // モバイルでは行の高さを小さく

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
      await onSubmit(data.prompt)
      form.reset()
      // 高さをリセット
      setTextareaHeight('auto')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
      <div className="relative flex-grow border bg-background-muted p-2 md:rounded-2xl md:rounded-t-3xl md:border-border-strong md:bg-background md:p-4">
        <Textarea
          {...form.register('prompt')}
          placeholder="Send a message"
          onChange={(e) => {
            form.setValue('prompt', e.target.value)
            e.target.style.height = 'auto'
            const maxHeight = lineHeight * (isMobile ? 12 : 18) // モバイルでは最大行数を減らす
            const newHeight = Math.min(e.target.scrollHeight, maxHeight)
            e.target.style.height = `${newHeight}px`
            setTextareaHeight(`${newHeight}px`)
          }}
          className="min-h-[24px] resize-none border-0 bg-transparent px-1 pb-10 pt-1 text-base text-foreground-strong shadow-none focus-visible:ring-0 md:pb-12 md:text-lg"
          style={{
            overflow:
              parseInt(textareaHeight) >= lineHeight * (isMobile ? 12 : 18) ? 'auto' : 'hidden',
            lineHeight: `${lineHeight}px`,
            height: textareaHeight,
            fontSize: isMobile ? '16px' : '', // iOSでの自動ズームを防止するために16px以上に設定
            touchAction: 'manipulation', // タッチ操作の最適化
            WebkitAppearance: 'none', // iOSのデフォルトスタイルを無効化
          }}
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
              className="h-8 w-8 rounded-lg bg-foreground p-1 hover:bg-foreground/80 md:h-10 md:w-10 md:p-2"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

export { Component as OChatTextarea }

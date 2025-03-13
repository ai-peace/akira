'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowUp, Paperclip } from 'lucide-react'
import { FC, useState } from 'react'
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
  const lineHeight = 24

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
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
      <div className="md:border-border-muted relative flex-grow rounded-t-2xl border bg-background-soft p-4 md:rounded-2xl md:bg-background">
        <Textarea
          {...form.register('prompt')}
          placeholder="Send a message"
          onChange={(e) => {
            form.setValue('prompt', e.target.value)
            e.target.style.height = 'auto'
            const maxHeight = lineHeight * 18
            const newHeight = Math.min(e.target.scrollHeight, maxHeight)
            e.target.style.height = `${newHeight}px`
            setTextareaHeight(`${newHeight}px`)
          }}
          className="min-h-[24px] resize-none border-0 bg-transparent p-0 pb-12 text-lg text-foreground-strong shadow-none focus-visible:ring-0"
          style={{
            overflow: parseInt(textareaHeight) >= lineHeight * 18 ? 'auto' : 'hidden',
            lineHeight: `${lineHeight}px`,
            height: textareaHeight,
          }}
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
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

export { Component as OChatTextarea }

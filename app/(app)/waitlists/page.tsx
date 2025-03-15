'use client'

import EDotFont from '@/components/01_elements/EDotFont'
import ELogoAkira from '@/components/01_elements/ELogoAkira'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateWaitList } from '@/hooks/resources/wait-list/useCreateWaitList'
import { handleError } from '@/utils/error-handler.helper'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

const formSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type FormData = z.infer<typeof formSchema>

export default function WaitListPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createWaitList } = useCreateWaitList()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      await createWaitList({
        json: {
          email: data.email,
        },
      })
      toast.success('You are on the waitlist!', {
        description: 'We will notify you when AKIRA is available.',
      })
      form.reset()
    } catch (error) {
      handleError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* ロゴ */}
      <div className="mb-8">
        <ELogoAkira className="fill-foreground dark:fill-foreground" width={150} height={63} />
      </div>

      {/* アキラくんのイラスト */}
      <div className="relative mb-8 h-32 w-32">
        <Image
          src="/images/picture/picture_akira-kun.png"
          alt="AKIRA"
          fill
          className="object-contain"
        />
      </div>

      {/* メインコンテンツ */}
      <div className="mb-8 max-w-lg text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground-strong md:text-3xl">
          <EDotFont text="Join the AKIRA Waitlist" className="font-[600]" animate={true} />
        </h1>
        <p className="mb-6 text-base text-foreground/80 md:text-lg">
          Be the first to know when AKIRA becomes available. Join our waitlist to get early access.
        </p>
      </div>

      {/* フォーム */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto w-full max-w-md space-y-4">
        <div className="space-y-2">
          <Input
            {...form.register('email')}
            type="email"
            placeholder="Enter your email"
            className="h-12 rounded-full border-foreground bg-background-soft px-6 text-foreground"
            disabled={isSubmitting}
          />
          {form.formState.errors.email && (
            <p className="px-4 text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-full bg-accent-1 text-white hover:bg-accent-1/90"
          disabled={isSubmitting}
        >
          <EDotFont text={isSubmitting ? 'Joining...' : 'Join Waitlist'} />
        </Button>
      </form>

      {/* フッター */}
      <div className="mt-8 text-sm text-foreground/60">
        <EDotFont
          text="We'll notify you as soon as AKIRA is ready for you!"
          className="font-[400]"
          animate={true}
          delay={200}
        />
      </div>
    </div>
  )
}

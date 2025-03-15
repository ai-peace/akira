'use client'

import { EDotButton } from '@/components/01_elements/EDotButton'
import EDotFont from '@/components/01_elements/EDotFont'
import ELogoAkira from '@/components/01_elements/ELogoAkira'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

export default function UsersLimitExceedPage() {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
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

        {/* エラーメッセージ */}
        <div className="mb-8 max-w-lg">
          <h1 className="mb-0 text-2xl font-bold text-foreground-strong md:text-3xl">
            <EDotFont text="Sorry!" className="font-[600]" animate={true} />
          </h1>
          <h1 className="mb-4 text-2xl font-bold text-foreground-strong md:text-3xl">
            <EDotFont
              text="User Registration Limit Reached."
              className="font-[600]"
              animate={true}
            />
          </h1>
          <p className="mb-6 text-base text-foreground/80 md:text-lg">
            <EDotFont
              text="We're currently at capacity with our user registrations. Join our waitlist to be notified when spots become available."
              className="font-[400]"
              animate={true}
              delay={100}
            />
          </p>
          <div className="text-sm text-foreground/60">
            <EDotFont
              text="Thank you for your interest in AKIRA!"
              className="font-[400]"
              animate={true}
              delay={200}
            />
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col gap-4 md:flex-row">
          <EDotButton
            href="/"
            text="Return to Home"
            className="w-[160px] bg-background-soft hover:bg-background-soft/90"
          />
          <EDotButton
            href="/waitlist"
            text="Join Waitlist"
            className="w-[160px] bg-accent-1 hover:bg-accent-1/90"
          />
        </div>
      </div>
    </div>
  )
}

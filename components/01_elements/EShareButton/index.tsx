'use client'

import { useState } from 'react'
import { Share, Link, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

export default function EShareButton({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareTitle = 'AKIRA - SEARCH AI AGENT'

  const shareOptions = [
    {
      name: 'X',
      icon: <X size={20} />,
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
          '_blank',
        )
      },
    },
    {
      name: 'Telegram',
      icon: <Send size={20} />,
      action: () => {
        const telegramUrl = `https://telegram.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
        window.open(telegramUrl, '_blank')
      },
    },
    {
      name: 'Copy URL',
      icon: <Link size={20} />,
      action: () => {
        navigator.clipboard.writeText(shareUrl)
        alert('URL copied to clipboard!')
      },
    },
  ]

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      <div className="relative">
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 flex flex-col gap-2 rounded-lg border border-border bg-background p-2 shadow-lg">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => {
                  option.action()
                  setIsOpen(false)
                }}
                className="flex items-center justify-center rounded-full p-3 transition-colors hover:bg-muted"
                aria-label={option.name}
                title={option.name}
              >
                {option.icon}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
          aria-label="Share"
          title="Share"
        >
          <Share size={20} />
        </button>
      </div>
    </div>
  )
}

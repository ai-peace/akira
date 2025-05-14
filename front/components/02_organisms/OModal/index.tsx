'use client'

import { X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { FC, ReactNode } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  heading: ReactNode
  main: ReactNode
  footer: ReactNode
  className?: string
}

const Component: FC<Props> = ({ isOpen, onClose, heading, main, footer, className = '' }) => {
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`relative mx-4 max-w-md rounded-lg border-2 ${
          isDarkMode ? 'border-white/60' : 'border-black/60'
        } bg-background p-6 shadow-lg ${className}`}
      >
        <div className="mb-4 text-center">{heading}</div>

        <div className="mb-6 text-center">{main}</div>

        <div className="flex flex-col items-center justify-center gap-4 md:flex-row">{footer}</div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-foreground hover:text-foreground-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export { Component as OModal }

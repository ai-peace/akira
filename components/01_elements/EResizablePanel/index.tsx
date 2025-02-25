'use client'

import { PanelLeftCloseIcon, PanelRightCloseIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

type Props = {
  minWidth?: string
  maxWidth?: string
  position?: 'left' | 'right'
  children: React.ReactNode
}

const Component = ({
  minWidth = '16rem',
  maxWidth = '20rem',
  children,
  position = 'right',
}: Props) => {
  const storageKey = `resizable-panel-${position}-visible`
  const [isVisible, setIsVisible] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const stored = localStorage.getItem(storageKey)
    if (stored !== null) {
      setIsVisible(stored === 'true')
    }
  }, [storageKey])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(storageKey, isVisible.toString())
    }
  }, [isVisible, storageKey, isClient])

  if (!isClient) {
    return (
      <div
        className={`relative h-full border-border-subtle bg-background-soft ${
          position === 'left' ? 'border-l' : 'border-r'
        }`}
        style={{ minWidth, maxWidth }}
      >
        <div className="relative h-full">{children}</div>
      </div>
    )
  }

  if (!isVisible) {
    return (
      <div className="flex h-full">
        <div className="relative flex h-12 w-full items-center px-2">
          <button
            onClick={() => setIsVisible(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-background-muted"
            aria-label="サイドバーを開く"
          >
            {position === 'left' ? (
              <PanelLeftCloseIcon className="h-5 w-5" />
            ) : (
              <PanelRightCloseIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative h-full border-border-subtle bg-background-soft ${
        position === 'left' ? 'border-l' : 'border-r'
      } overflow-y-scroll`}
      style={{ minWidth, maxWidth }}
    >
      <div className="sticky left-0 top-0 z-10 w-full bg-background-soft px-2">
        <div className="relative flex h-12 w-full items-center">
          <button
            onClick={() => setIsVisible(false)}
            className="h-9 cursor-pointer rounded-md px-2 hover:bg-background-muted"
            aria-label="サイドバーを閉じる"
          >
            {position === 'left' ? (
              <PanelRightCloseIcon className="h-5 w-5 text-foreground" />
            ) : (
              <PanelLeftCloseIcon className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
      </div>
      <div className="relative mb-20 mt-0">{children}</div>
    </div>
  )
}

export { Component as EResizablePanel }

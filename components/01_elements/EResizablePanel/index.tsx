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
        <button
          onClick={() => setIsVisible(true)}
          className="flex h-12 w-12 items-center justify-center hover:bg-background-muted"
          aria-label="サイドバーを開く"
        >
          {position === 'left' ? (
            <PanelLeftCloseIcon className="h-4 w-4" />
          ) : (
            <PanelRightCloseIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    )
  }

  return (
    <div
      className={`relative h-full border-border-subtle bg-background-soft ${
        position === 'left' ? 'border-l' : 'border-r'
      }`}
      style={{ minWidth, maxWidth }}
    >
      <div
        className={`absolute top-0 mt-0.5 px-2 ${position === 'left' ? '-left-14 -ml-1' : '-right-14 -mr-1'} z-10`}
      >
        <button
          onClick={() => setIsVisible(false)}
          className="flex h-12 w-12 items-center justify-center rounded-md hover:bg-background-muted"
          aria-label="サイドバーを閉じる"
        >
          {position === 'left' ? (
            <PanelRightCloseIcon className="h-4 w-4" />
          ) : (
            <PanelLeftCloseIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="relative h-full">{children}</div>
    </div>
  )
}

export { Component as EResizablePanel }

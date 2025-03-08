'use client'

import { ONewChatButton } from '@/components/02_organisms/ONewChatButton'
import { OWalletConnectButton } from '@/components/02_organisms/OWalletConnectButton'
import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { PanelLeftCloseIcon, PanelRightCloseIcon } from 'lucide-react'
import { useState } from 'react'
import { OUserPromptUsage } from '../OUserPromptUsage'

type Props = {
  position?: 'left' | 'right'
  children: React.ReactNode
}

const Component = ({ children, position = 'right' }: Props) => {
  const { userPrivate } = useUserPrivate()
  const [isVisible, setIsVisible] = useState(true)

  if (!userPrivate) return null

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
          <ONewChatButton />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative h-full w-[320px] border-border-subtle bg-background-soft ${
        position === 'left' ? 'border-l' : 'border-r'
      } flex flex-col overflow-y-scroll`}
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
          <ONewChatButton />
        </div>
      </div>
      <div className="relative mt-0 w-full flex-grow overflow-x-hidden">{children}</div>
      <div className="sticky bottom-0 left-0 right-0 mt-auto bg-background-soft px-4 py-4">
        <div className="flex flex-col gap-4">
          <OUserPromptUsage />
          <OWalletConnectButton />
        </div>
      </div>
    </div>
  )
}

export { Component as EResizablePanel }

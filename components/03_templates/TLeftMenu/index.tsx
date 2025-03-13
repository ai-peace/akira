'use client'

import { ONewChatButton } from '@/components/02_organisms/ONewChatButton'
import { OWalletConnectButton } from '@/components/02_organisms/OWalletConnectButton'
import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { PanelLeftCloseIcon, PanelRightCloseIcon } from 'lucide-react'
import { useState } from 'react'
import { OUserPromptUsage } from '@/components/02_organisms/OUserPromptUsage'
import { useChats } from '@/hooks/resources/chats/useChats'
import { OChatList } from '@/components/02_organisms/OChatList'

const Component = () => {
  const { userPrivate } = useUserPrivate()
  const [isVisible, setIsVisible] = useState(true)

  const { chats, chatsIsLoading, chatsError } = useChats()

  if (chatsIsLoading) return null
  if (chatsError) return null
  if (!chats) return null
  if (!userPrivate) return null
  if (!isVisible) {
    return (
      <div className="absolute left-0 top-0 z-10 flex h-12 items-center justify-center px-2">
        <button
          onClick={() => setIsVisible(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-background-muted"
          aria-label="サイドバーを開く"
        >
          <PanelLeftCloseIcon className="h-5 w-5" />
        </button>
        <ONewChatButton />
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-[320px] flex-col overflow-y-scroll border-border-subtle bg-background-soft">
      <div className="sticky left-0 top-0 z-10 w-full bg-background-soft px-2">
        <div className="relative flex h-12 w-full items-center">
          <button
            onClick={() => setIsVisible(false)}
            className="h-9 cursor-pointer rounded-md px-2 hover:bg-background-muted"
            aria-label="サイドバーを閉じる"
          >
            <PanelLeftCloseIcon className="h-5 w-5 text-foreground" />
          </button>
          <ONewChatButton />
        </div>
      </div>
      <div className="relative mt-0 w-full flex-grow overflow-x-hidden">
        <div className="h-full overflow-x-auto overflow-y-auto px-4 py-3">
          <OChatList chats={chats} />
        </div>
      </div>
      <div className="sticky bottom-0 left-0 right-0 mt-auto bg-background-soft px-4 py-4">
        <div className="flex flex-col gap-4">
          <OUserPromptUsage />
          <OWalletConnectButton />
        </div>
      </div>
    </div>
  )
}

export { Component as TLeftMenu }

'use client'

import { ONewChatButton } from '@/components/02_organisms/ONewChatButton'
import { OWalletConnectButton } from '@/components/02_organisms/OWalletConnectButton'
import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { PanelLeftCloseIcon, PanelRightCloseIcon } from 'lucide-react'
import { useAtom } from 'jotai'
import { leftMenuVisibleAtom } from '@/store/atoms/menuAtoms'
import { OUserPromptUsage } from '@/components/02_organisms/OUserPromptUsage'
import { useChats } from '@/hooks/resources/chats/useChats'
import { OChatList } from '@/components/02_organisms/OChatList'

const Component = () => {
  const { userPrivate } = useUserPrivate()
  const [isVisible, setIsVisible] = useAtom(leftMenuVisibleAtom)

  const { chats, chatsIsLoading, chatsError } = useChats()

  if (chatsIsLoading) return null
  if (chatsError) return null
  if (!chats) return null
  if (!userPrivate) return null
  if (!isVisible) return <></>

  return (
    <div className="relative flex h-full w-[320px] flex-col overflow-y-scroll border-border-subtle bg-background-soft">
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

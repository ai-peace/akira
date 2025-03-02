'use client'

import { OChatList } from '@/components/02_organisms/OChatList'
import { EResizablePanel } from '@/components/02_organisms/OResizablePanel'
import { useChats } from '@/hooks/resources/chats/useChats'
import { TChatListsSkeleton } from './skeleton'

export { Component as TChatLists }

const Component = () => {
  return (
    <EResizablePanel>
      <BaseComponent />
    </EResizablePanel>
  )
}

const BaseComponent = () => {
  const { chats, chatsIsLoading, chatsError } = useChats()

  if (!chats) return <TChatListsSkeleton />
  if (chatsIsLoading) return <TChatListsSkeleton />
  if (chatsError) return <div>Error</div>

  return (
    <div className="h-full overflow-x-auto overflow-y-auto px-4 py-3">
      <OChatList chats={chats} />
    </div>
  )
}

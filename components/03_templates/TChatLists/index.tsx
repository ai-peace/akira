'use client'

import { EResizablePanel } from '@/components/02_organisms/OResizablePanel'
import { OChatList } from '@/components/02_organisms/OChatList'

import { Suspense } from 'react'
import { TDocumentTreeSkeleton } from './skeleton'
import { useChats } from '@/hooks/resources/chats/useChats'
import { ChatEntity } from '@/domains/entities/chat.entity'

type Props = {
  openAll?: boolean
  animation?: boolean
}

const Component = ({ openAll = false, animation = false }: Props) => {
  const { chats } = useChats()

  if (!chats) return <TDocumentTreeSkeleton />

  return <BaseComponent chats={chats} openAll={openAll} animation={animation} />
}

export { Component as TChatLists }

type BaseComponentProps = {
  chats: ChatEntity[]
  openAll?: boolean
  animation?: boolean
}

const BaseComponent = ({ chats, openAll = false, animation = false }: BaseComponentProps) => {
  return (
    <Suspense fallback={<TDocumentTreeSkeleton />}>
      <EResizablePanel>
        <div className="h-full overflow-x-auto overflow-y-auto px-4 py-3">
          <OChatList chats={chats} />
        </div>
      </EResizablePanel>
    </Suspense>
  )
}

import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { ChatEntity } from '@/domains/entities/chat.entity'
import Link from 'next/link'

type Props = {
  chats: ChatEntity[]
}

const Component = ({ chats }: Props) => {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold">Histories</div>
      {chats.map((chat) => (
        <div key={chat.uniqueKey}>
          <Link href={`/chats/${chat.uniqueKey}`}>
            <div className="flex cursor-pointer items-center gap-1 rounded-sm py-1 text-sm text-foreground-muted hover:bg-background-muted">
              <ETypewriterText
                text={chat.title ?? 'aaaa'}
                className="truncate whitespace-nowrap text-sm"
                speed={15}
                delay={0}
                animate={false}
              />
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}

export { Component as OChatList }

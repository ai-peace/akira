import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { ChatEntity } from '@/domains/entities/chat.entity'
import { TrophyIcon } from 'lucide-react'
import Link from 'next/link'

type Props = {
  chats: ChatEntity[]
}

const Component = ({ chats }: Props) => {
  return (
    <div className="my-3">
      <div className="mb-2 flex items-center justify-between font-semibold">
        Users' digg histories
      </div>
      {chats.map((chat) => (
        <div key={chat.uniqueKey}>
          <Link href={`/chats/${chat.uniqueKey}`}>
            <div className="flex cursor-pointer items-center gap-1 rounded-sm py-1 text-sm text-foreground-muted hover:bg-background-muted">
              <div className="mr-1">
                <span className="w-0 shrink-0" />
                <TrophyIcon className="h-3 w-3 shrink-0 text-foreground opacity-30" />
              </div>
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

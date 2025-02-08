import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { ChatEntity } from '@/domains/entities/chat.entity'
import { TrophyIcon, WalletIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type Props = {
  chats: ChatEntity[]
}

const Component = ({ chats }: Props) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <div className="my-3">
          <div className="mb-2 flex items-center justify-between font-semibold">
            Users&apos; digg histories
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
      </div>
      <div className="mb-4 px-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full bg-[#AB9FF2] text-white transition-colors hover:bg-[#9F91E7]">
              <WalletIcon className="mr-2 h-4 w-4" />
              Wallet Connect
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Under Construction</AlertDialogTitle>
              <AlertDialogDescription>
                This feature is currently under development. Please check back later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export { Component as OChatList }

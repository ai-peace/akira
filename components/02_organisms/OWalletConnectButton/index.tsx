import EDotFont from '@/components/01_elements/EDotFont'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePrivy } from '@privy-io/react-auth'
import { WalletIcon } from 'lucide-react'
import { OUserProfile } from '../OUserProfile'

type Props = {
  className?: string
}

const Component = ({ className }: Props) => {
  const { login, authenticated, ready } = usePrivy()

  // Privyが準備できていない場合は工事中ダイアログを表示
  if (!ready) {
    return null
  }

  // ログイン済みの場合はログイン済みボタンを表示
  if (authenticated) return <OUserProfile />

  // ログインボタンを表示
  return (
    <Button
      onClick={() => login()}
      className={cn(
        'w-full bg-background-soft text-foreground shadow-none transition-colors',

        className,
      )}
    >
      <WalletIcon className="mr-1 h-4 w-4" />
      <EDotFont text="Login" />
    </Button>
  )
}

export { Component as OWalletConnectButton }

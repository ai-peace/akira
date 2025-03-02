import EDotFont from '@/components/01_elements/EDotFont'
import { Button } from '@/components/ui/button'
import { usePrivyAuthentication } from '@/hooks/usePrivyAuthentication'
import { Loader2, WalletIcon } from 'lucide-react'
import { OUserProfile } from '../OUserProfile'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

const Component = ({ className }: Props) => {
  const { login, loginned, ready } = usePrivyAuthentication({
    redirectUrl: '/',
  })

  // Privyが準備できていない場合は工事中ダイアログを表示
  if (!ready) {
    return (
      <div className="flex w-full items-center justify-center gap-2">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    )
  }

  // ログイン済みの場合はログイン済みボタンを表示
  if (loginned) return <OUserProfile />

  // ログインボタンを表示
  return (
    <Button
      onClick={() => login()}
      className={cn(
        'w-full bg-foreground text-background-soft transition-colors hover:bg-foreground/80',
        className,
      )}
    >
      <WalletIcon className="mr-1 h-4 w-4" />
      <EDotFont text="Login" />
    </Button>
  )
}

export { Component as OWalletConnectButton }

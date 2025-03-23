import { EDotButton } from '@/components/01_elements/EDotButton'
import { cn } from '@/lib/utils'
import { usePrivy } from '@privy-io/react-auth'
import { Loader2, WalletIcon } from 'lucide-react'
import { OUserProfile } from '../OUserProfile'

type Props = {
  className?: string
}

const Component = ({ className }: Props) => {
  const { login, authenticated, ready } = usePrivy()

  // Privyが準備できていない場合は工事中ダイアログを表示
  if (!ready) {
    return (
      <EDotButton
        className={cn(
          'h-12 w-full rounded-full border-foreground bg-background-soft text-foreground shadow-none transition-colors hover:text-background',

          className,
        )}
        icon={<Loader2 className="mr-1 h-4 w-4 animate-spin" />}
        text="Loging..."
      />
    )
  }

  // ログイン済みの場合はログイン済みボタンを表示
  if (authenticated) return null

  // ログインボタンを表示
  return (
    <EDotButton
      onClick={() => login()}
      className={cn(
        'h-12 w-full rounded-full border-foreground bg-background-soft text-foreground shadow-none transition-colors hover:text-background',

        className,
      )}
      icon={<WalletIcon className="mr-1 h-4 w-4" />}
      text="Login"
    />
  )
}

export { Component as OWalletConnectButton }

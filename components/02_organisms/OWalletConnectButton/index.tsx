import EDotFont from '@/components/01_elements/EDotFont'
import { Button } from '@/components/ui/button'
import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { usePrivyAuthentication } from '@/hooks/usePrivyAuthentication'
import { Loader2, WalletIcon } from 'lucide-react'

const Component = () => {
  const { login, loginned, ready } = usePrivyAuthentication({
    redirectUrl: '/',
  })

  // Privyが準備できていない場合は工事中ダイアログを表示
  if (!ready) {
    return (
      <Button className="w-full bg-foreground text-background-soft transition-colors hover:bg-foreground/80">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </Button>
    )
  }

  // ログイン済みの場合はログイン済みボタンを表示
  if (loginned) return <LogginedComponent />

  // ログインボタンを表示
  return (
    <Button
      onClick={() => login()}
      className="w-full bg-foreground text-background-soft transition-colors hover:bg-foreground/80"
    >
      <WalletIcon className="mr-1 h-4 w-4" />
      <EDotFont text="Login" />
    </Button>
  )
}

export { Component as OWalletConnectButton }

const LogginedComponent = () => {
  const { logout } = usePrivyAuthentication({
    redirectUrl: '/',
  })
  const { userPrivate, userPrivateError, userPrivateIsLoading } = useUserPrivate()
  return (
    <Button
      className="w-full bg-transparent transition-opacity hover:opacity-20"
      onClick={() => logout()}
    >
      {userPrivate?.name?.slice(0, 2)}
    </Button>
  )
}

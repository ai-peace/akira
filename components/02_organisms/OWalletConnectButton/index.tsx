import EDotFont from '@/components/01_elements/EDotFont'
import { Button } from '@/components/ui/button'
import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { usePrivyAuthentication } from '@/hooks/usePrivyAuthentication'
import { WalletIcon } from 'lucide-react'
import Image from 'next/image'

const Component = () => {
  const { login, loginned, ready, logout } = usePrivyAuthentication({
    redirectUrl: '/',
  })

  // Privyが準備できていない場合は工事中ダイアログを表示
  if (!ready) {
    return (
      <Button className="w-full bg-[#AB9FF2] text-white transition-colors hover:bg-[#9F91E7]">
        <WalletIcon className="mr-2 h-4 w-4" />
        <EDotFont text="Wallet Connect" />
      </Button>
    )
  }

  // ログイン済みの場合はログイン済みボタンを表示
  if (loginned) return <LogginedComponent />

  // ログインボタンを表示
  return (
    <Button
      onClick={() => login()}
      className="w-full bg-foreground text-white transition-colors hover:bg-foreground/80"
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

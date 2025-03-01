import EDotFont from '@/components/01_elements/EDotFont'
import { Button } from '@/components/ui/button'
import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { usePrivyAuthentication } from '@/hooks/usePrivyAuthentication'
import { usePrivy } from '@privy-io/react-auth'
import { Loader2, WalletIcon } from 'lucide-react'
import Image from 'next/image'

const Component = () => {
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

  // DiceBearのアバターURLを生成
  const generateAvatarUrl = (name: string) => {
    // 名前がない場合はデフォルトの文字列を使用
    const seed = name || 'Anonymous User'
    // DiceBearのAPIを使用してアバターを生成（ここではpixelArtスタイルを使用）
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`
  }

  if (userPrivateIsLoading)
    return (
      <div className="flex w-full items-center justify-center gap-2">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    )

  if (userPrivateError) {
    return <div>Error: {userPrivateError}</div>
  }

  return (
    <div className="flex items-center gap-2">
      {userPrivate?.name && (
        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={generateAvatarUrl(
              userPrivate.solanaSystemAccountAddress || userPrivate.email || userPrivate.name,
            )}
            alt="User Avatar"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-foreground-soft text-md">GuestUser</div>
        <div className="truncate text-xs">{userPrivate?.name}</div>
      </div>
    </div>
  )
}

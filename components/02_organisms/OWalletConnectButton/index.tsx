import { Button } from '@/components/ui/button'
import { usePrivyAuthentication } from '@/hooks/use-privy-authentication'
import { WalletIcon } from 'lucide-react'

const Component = () => {
  const { login, loginned, ready, logout } = usePrivyAuthentication()

  // Privyが準備できていない場合は工事中ダイアログを表示
  if (!ready) {
    return (
      <Button className="w-full bg-[#AB9FF2] text-white transition-colors hover:bg-[#9F91E7]">
        <WalletIcon className="mr-2 h-4 w-4" />
        Wallet Connect
      </Button>
    )
  }

  // ログイン済みの場合はログイン済みボタンを表示
  if (loginned) {
    return (
      <Button
        className="w-full bg-[#9F91E7] text-white transition-colors hover:bg-[#8A7DD3]"
        onClick={() => logout()}
      >
        <WalletIcon className="mr-2 h-4 w-4" />
        Connected
      </Button>
    )
  }

  // ログインボタンを表示
  return (
    <Button
      onClick={() => login()}
      className="w-full bg-[#AB9FF2] text-white transition-colors hover:bg-[#9F91E7]"
    >
      <WalletIcon className="mr-2 h-4 w-4" />
      Wallet Connect
    </Button>
  )
}

export { Component as OWalletConnectButton }

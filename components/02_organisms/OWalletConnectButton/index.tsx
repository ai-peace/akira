import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { usePrivyAuthentication } from '@/hooks/use-privy-authentication'
import { WalletIcon } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'

const Component = () => {
  const { ready } = usePrivy()
  const { login, loginned } = usePrivyAuthentication()

  // Privyが準備できていない場合は工事中ダイアログを表示
  if (!ready) {
    return (
      <AlertDialog defaultOpen={false}>
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
    )
  }

  // ログイン済みの場合はログイン済みボタンを表示
  if (loginned) {
    return (
      <Button
        className="w-full bg-[#9F91E7] text-white transition-colors hover:bg-[#8A7DD3]"
        disabled
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

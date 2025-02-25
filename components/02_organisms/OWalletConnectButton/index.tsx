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
import { WalletIcon } from 'lucide-react'

const Component = () => {
  return (
    <>
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
    </>
  )
}

export { Component as OWalletConnectButton }

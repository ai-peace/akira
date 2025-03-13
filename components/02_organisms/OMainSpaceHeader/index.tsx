'use client'
import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { OThemeChangeButton } from '../OThemeChangeButton'
import { OWalletConnectButton } from '../OWalletConnectButton'
import { Menu, SquarePen } from 'lucide-react'

const OMainSpaceHeader = () => {
  const { userPrivate } = useUserPrivate()
  return (
    <div className="absolute right-0 top-0 z-10 flex h-12 w-full items-center justify-between gap-2 px-2">
      <div>
        <button
          onClick={() => {}}
          className="cursor-pointer rounded-md p-2 hover:bg-background-muted"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>

        <button
          onClick={() => {}}
          className="cursor-pointer rounded-md p-2 hover:bg-background-muted"
        >
          <SquarePen className="h-5 w-5 text-foreground" />
        </button>
      </div>
      <div>
        <OThemeChangeButton />
        {!userPrivate && <OWalletConnectButton className="w-[100px]" />}
      </div>
    </div>
  )
}

export { OMainSpaceHeader }

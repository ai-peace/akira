'use client'

import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { Menu, SquarePen } from 'lucide-react'
import { OThemeChangeButton } from '../OThemeChangeButton'
import { OWalletConnectButton } from '../OWalletConnectButton'
import { useAtom } from 'jotai'
import { leftMenuVisibleAtom } from '@/store/atoms/menuAtoms'
import EShareButton from '@/components/01_elements/EShareButton'

const OMainSpaceHeader = () => {
  const { userPrivate } = useUserPrivate()
  const [leftMenuVisible, setLeftMenuVisible] = useAtom(leftMenuVisibleAtom)

  const toggleLeftMenu = () => {
    setLeftMenuVisible(!leftMenuVisible)
  }

  return (
    <div className="absolute right-0 top-0 z-10 flex h-12 w-full items-center justify-between gap-2 px-2">
      <div>
        <button
          onClick={toggleLeftMenu}
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
      <div className="flex items-center gap-2">
        <EShareButton className="static bottom-auto right-auto z-auto" />
        <OThemeChangeButton />
        {!userPrivate && <OWalletConnectButton className="w-[100px]" />}
      </div>
    </div>
  )
}

export { OMainSpaceHeader }

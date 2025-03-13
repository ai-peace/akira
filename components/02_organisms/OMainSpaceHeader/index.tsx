'use client'

import EShareButton from '@/components/01_elements/EShareButton'
import { leftMenuVisibleAtom } from '@/store/atoms/menuAtoms'
import { useAtom } from 'jotai'
import { Menu, SquarePen } from 'lucide-react'
import { OThemeChangeButton } from '../OThemeChangeButton'

const OMainSpaceHeader = () => {
  const [leftMenuVisible, setLeftMenuVisible] = useAtom(leftMenuVisibleAtom)

  const toggleLeftMenu = () => {
    setLeftMenuVisible(!leftMenuVisible)
  }

  return (
    <div className="absolute right-0 top-0 z-10 flex h-12 w-full items-center justify-between gap-2 bg-background px-2 md:bg-background/0 md:px-4">
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
      </div>
    </div>
  )
}

export { OMainSpaceHeader }

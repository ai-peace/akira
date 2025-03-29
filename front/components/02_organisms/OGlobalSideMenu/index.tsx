import { OThemeChangeButton } from '../OThemeChangeButton'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'

const Component = () => {
  return (
    <nav className="absolute left-0 top-0 flex h-screen w-[72px] flex-col items-center gap-2 p-4">
      <Link
        href="/"
        className="hover:bg-background-muted group flex w-full cursor-pointer flex-col items-center gap-1 rounded-md p-2"
      >
        <PlusCircle className="h-5 w-5 text-foreground" />
        <span className="text-[10px] text-foreground">NEW</span>
      </Link>
      <div className="hover:bg-background-muted mt-auto flex w-full cursor-pointer flex-col items-center gap-1 rounded-md p-2"></div>
      <OThemeChangeButton />
    </nav>
  )
}

export { Component as OGlobalSideMenu }

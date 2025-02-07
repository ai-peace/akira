import { OThemeChangeButton } from '../OThemeChangeButton'

const Component = () => {
  return (
    <nav className="absolute left-0 top-0 flex h-screen w-[72px] flex-col items-center gap-2 p-4">
      <div className="group mt-auto flex w-full cursor-pointer flex-col items-center gap-1 rounded-md p-2 hover:bg-background-muted"></div>
      <OThemeChangeButton />
    </nav>
  )
}

export { Component as OGlobalSideMenu }

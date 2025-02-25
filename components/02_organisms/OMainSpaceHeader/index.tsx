import { ONewChatButton } from '../ONewChatButton'
import { OThemeChangeButton } from '../OThemeChangeButton'

const OMainSpaceHeader = () => {
  return (
    <div className="absolute right-0 top-0 z-10 flex h-12 w-full items-center justify-end px-2">
      <OThemeChangeButton />
      <ONewChatButton />
    </div>
  )
}

export { OMainSpaceHeader }

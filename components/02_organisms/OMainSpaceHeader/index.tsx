import { ONewChatButton } from '../ONewChatButton'
import { OThemeChangeButton } from '../OThemeChangeButton'

const OMainSpaceHeader = () => {
  return (
    <div className="absolute left-0 top-0 z-10 flex w-full items-center justify-end px-2 py-2">
      <OThemeChangeButton />
      <ONewChatButton />
    </div>
  )
}

export { OMainSpaceHeader }

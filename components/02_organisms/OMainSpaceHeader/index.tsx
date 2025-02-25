import { ONewChatButton } from '../ONewChatButton'
import { OThemeChangeButton } from '../OThemeChangeButton'

const OMainSpaceHeader = () => {
  return (
    <div className="absolute left-0 top-0 flex w-full items-center justify-end bg-red-400 px-1 py-0.5">
      <OThemeChangeButton />
      <ONewChatButton />
    </div>
  )
}

export { OMainSpaceHeader }

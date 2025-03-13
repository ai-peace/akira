'use client'
import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { OThemeChangeButton } from '../OThemeChangeButton'
import { OWalletConnectButton } from '../OWalletConnectButton'

const OMainSpaceHeader = () => {
  const { userPrivate } = useUserPrivate()
  return (
    <div className="absolute right-0 top-0 z-10 flex h-12 items-center justify-end gap-2 px-2">
      <OThemeChangeButton />
      {!userPrivate && <OWalletConnectButton className="w-[100px]" />}
    </div>
  )
}

export { OMainSpaceHeader }

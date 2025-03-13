'use client'

import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { OWalletConnectButton } from '../OWalletConnectButton'

export const OBottomLoginButton = () => {
  const { userPrivate } = useUserPrivate()

  if (userPrivate) return null

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transform">
      <OWalletConnectButton className="shadow-lg" />
    </div>
  )
}

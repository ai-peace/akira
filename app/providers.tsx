'use client'

import { clientApplicationProperties } from '@/consts/client-application-properties'
import { PrivyProvider } from '@privy-io/react-auth'
import { PropsWithChildren } from 'react'
import PrivyCallback from './privy-callback'

export function Providers({ children }: PropsWithChildren) {
  return (
    <PrivyProvider
      appId={clientApplicationProperties.privyAppId}
      config={{
        loginMethods: ['wallet', 'email'],
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
        },
      }}
    >
      <PrivyCallback>{children}</PrivyCallback>
    </PrivyProvider>
  )
}

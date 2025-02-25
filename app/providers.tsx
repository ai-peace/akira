'use client'

import { clientApplicationProperties } from '@/consts/client-application-properties'
import { PrivyProvider } from '@privy-io/react-auth'
import { PropsWithChildren } from 'react'

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
      {children}
    </PrivyProvider>
  )
}

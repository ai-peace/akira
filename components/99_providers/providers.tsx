'use client'

import { clientApplicationProperties } from '@/consts/client-application-properties'
import { PrivyProvider } from '@privy-io/react-auth'
import { PropsWithChildren, useEffect } from 'react'
import PrivyCallback from '@/app/privy-callback'
import { ThemeProvider } from 'next-themes'

import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'

const solanaConnectors = toSolanaWalletConnectors({
  // デフォルトでは、shouldAutoConnectは有効になっています
  shouldAutoConnect: true,
})

export function Providers({ children }: PropsWithChildren) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return (
    <PrivyProvider
      appId={clientApplicationProperties.privyAppId}
      config={{
        loginMethods: ['wallet', 'email'],
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
        },
        externalWallets: {
          solana: { connectors: solanaConnectors },
        },
      }}
    >
      <PrivyCallback>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </PrivyCallback>
    </PrivyProvider>
  )
}

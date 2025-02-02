'use client'

import { useEffect } from 'react'
import { Providers } from './providers'
import { ThemeProvider } from 'next-themes'

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Providers>{children}</Providers>
    </ThemeProvider>
  )
}

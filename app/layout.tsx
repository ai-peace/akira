import type { Metadata } from 'next'
import '@/styles/globals.css'
import { RootLayoutClient } from '@/components/99_providers/root-layout-client'
import { OGlobalSideMenu } from '@/components/02_organisms/OGlobalSideMenu'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Agent Rare',
  description: 'Agent Rare App',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Agent Rare',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0A0A0A" media="(prefers-color-scheme: dark)" />
        <meta name="application-name" content="Agent Rare" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Agent Rare" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <RootLayoutClient>
          <section className="flex h-screen bg-background-muted py-1 pl-[72px]">
            <OGlobalSideMenu />
            <section className="smooth-scroll flex h-full w-full overflow-y-scroll rounded-md border border-border-subtle bg-background text-foreground">
              {children}
            </section>
          </section>
        </RootLayoutClient>
        <Toaster />
      </body>
    </html>
  )
}

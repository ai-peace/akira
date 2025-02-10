import { OGlobalSideMenu } from '@/components/02_organisms/OGlobalSideMenu'
import { TChatLists } from '@/components/03_templates/TChatLists'
import { RootLayoutClient } from '@/components/99_providers/root-layout-client'
import { Toaster } from '@/components/ui/toaster'
import '@/styles/globals.css'
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'AKIRA',
  description: 'AKIRA App',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AKIRA',
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
        <meta name="application-name" content="AKIRA" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AKIRA" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <RootLayoutClient>
          <section className="flex h-screen bg-background-muted pl-[72px]">
            <OGlobalSideMenu />
            <section className="w-full bg-background text-foreground">
              <div className="relative flex h-full">
                <TChatLists />
                {children}
              </div>
            </section>
          </section>
        </RootLayoutClient>
        <Toaster />
      </body>
    </html>
  )
}

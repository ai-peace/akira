import { OMainSpaceHeader } from '@/components/02_organisms/OMainSpaceHeader'
import { TChatLists } from '@/components/03_templates/TChatLists'
import { RootLayoutClient } from '@/components/99_providers/root-layout-client'
import { Toaster } from '@/components/ui/toaster'
import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'Akira - SEARCH AI AGENT',
    template: '%s | Akira',
  },
  description:
    'Find your perfect items through natural conversations with AI. Akira makes your shopping experience smarter and more intuitive.',
  icons: {
    icon: '/icon512_rounded.png',
    apple: '/icon512_rounded.png',
  },
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Akira',
  },
  openGraph: {
    title: 'Akira - SEARCH AI AGENT',
    description:
      'Find your perfect items through natural conversations with AI. Akira makes your shopping experience smarter and more intuitive.',
    images: [
      {
        url: '/logo_akira_black.png',
        width: 512,
        height: 512,
        alt: 'Akira Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Akira - SEARCH AI AGENT',
    description: 'Find your perfect items through natural conversations with AI',
    images: ['/logo_akira_black.png'],
  },
  formatDetection: {
    telephone: false,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
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
        <Providers>
          <RootLayoutClient>
            <section className="flex h-screen bg-background-muted">
              <section className="w-full bg-background text-foreground">
                <div className="relative flex h-full">
                  <TChatLists />
                  <div className="relative flex h-full w-full">
                    <OMainSpaceHeader />
                    {children}
                  </div>
                </div>
              </section>
            </section>
          </RootLayoutClient>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

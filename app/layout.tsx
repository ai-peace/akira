import { Providers } from '@/components/99_providers/providers'
import { Toaster } from '@/components/ui/sonner'
import { clientApplicationProperties } from '@/consts/client-application-properties'
import '@/styles/globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'AKIRA - AI Buyer for Rare RWA NFTs',
    template: '%s | AKIRA',
  },
  description:
    'Find your perfect items through natural conversations with AI. AKIRA makes your shopping experience smarter and more intuitive.',
  icons: {
    icon: '/icon512_rounded.png',
    apple: '/icon512_rounded.png',
  },
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AKIRA',
  },
  openGraph: {
    title: 'AKIRA - AI Buyer for Rare RWA NFTs',
    description:
      'Find your perfect items through natural conversations with AI. AKIRA makes your shopping experience smarter and more intuitive.',
    images: [
      {
        url: `${clientApplicationProperties.appUrl}/images/ogp/ogp_twitterCard_default.jpg`,
        width: 512,
        height: 512,
        alt: 'AKIRA Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AKIRA - AI Buyer for Rare RWA NFTs',
    description: 'Find your perfect items through natural conversations with AI',
    images: [`${clientApplicationProperties.appUrl}/images/ogp/ogp_twitterCard_default.jpg`],
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
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}

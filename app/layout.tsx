import { Providers } from '@/front/components/99_providers/providers'
import { Toaster } from '@/front/components/ui/sonner'
import { clientApplicationProperties } from '@/front/consts/client-application-properties'
import '@/front/styles/globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'AKIRA - AI Buyer for Rare RWA NFTs',
    template: '%s | AKIRA',
  },
  description: 'AKIRA is an AI-powered buyer for rare RWA NFTs',
  icons: {
    icon: '/icon512_rounded.png',
    apple: '/icon512_rounded.png',
  },
  openGraph: {
    title: 'AKIRA - AI Buyer for Rare RWA NFTs',
    description: 'AKIRA is an AI-powered buyer for rare RWA NFTs',
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
    description: 'AKIRA is an AI-powered buyer for rare RWA NFTs',
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
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}

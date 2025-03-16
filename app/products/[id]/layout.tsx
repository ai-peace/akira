import { clientApplicationProperties } from '@/consts/client-application-properties'
import { Metadata } from 'next'

type Props = {
  children: React.ReactNode
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Note: This is a fallback metadata
  // The actual product metadata is set client-side in the page component
  // because we need to fetch the product data from the API
  return {
    title: `Product Details | AKIRA`,
    description: 'Discover unique products with AKIRA - Your AI shopping assistant',
    openGraph: {
      title: 'Product Details | AKIRA',
      description: 'Discover unique products with AKIRA - Your AI shopping assistant',
      type: 'website',
      images: [
        {
          url: `${clientApplicationProperties.appUrl}/images/ogp/ogp_twitterCard_default.jpg`,
          width: 1200,
          height: 630,
          alt: 'AKIRA - Your AI Shopping Assistant',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Product Details | AKIRA',
      description: 'Discover unique products with AKIRA - Your AI shopping assistant',
      images: [`${clientApplicationProperties.appUrl}/images/ogp/ogp_twitterCard_default.jpg`],
    },
  }
}

export default function ProductLayout({ children }: Props) {
  return <>{children}</>
}

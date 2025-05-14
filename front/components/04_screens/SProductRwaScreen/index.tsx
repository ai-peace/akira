'use client'

import { ProductEntity } from '@/common/domains/entities/product.entity'
import { getSolJpyRate } from '@/common/utils/currency'
import EDotFont from '@/front/components/01_elements/EDotFont'
import EShareButton from '@/front/components/01_elements/EShareButton'
import { OAppHeader } from '@/front/components/02_organisms/OAppHeader'
import { OThemeChangeButton } from '@/front/components/02_organisms/OThemeChangeButton'
import { Button } from '@/front/components/ui/button'
import { Card } from '@/front/components/ui/card'
import { usePromptGroup } from '@/front/hooks/resources/prompt-groups/usePromptGroup'
import { ArrowLeft } from 'lucide-react'
import Head from 'next/head'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'

type Props = {
  productUniqueKey: string
  promptGroupUniqueKey: string
}

// キーフレームアニメーションをグローバルスタイルとして追加
const styleElement = typeof document !== 'undefined' ? document.createElement('style') : null
if (styleElement) {
  styleElement.textContent = `
    @keyframes rotateY {
      0% { transform: rotateY(0deg); }
      100% { transform: rotateY(360deg); }
    }
    
    @keyframes floatText {
      0% { transform: translateZ(40px) translateY(0); }
      50% { transform: translateZ(70px) translateY(-5px); }
      100% { transform: translateZ(40px) translateY(0); }
    }
    
    .rotate-y-3d {
      animation: rotateY 8s linear infinite;
      transform-style: preserve-3d;
    }
    
    .float-text-3d {
      animation: floatText 4s ease-in-out infinite;
      transform-style: preserve-3d;
    }
    
    .image-container-3d {
      perspective: 1200px;
      transform-style: preserve-3d;
      perspective-origin: center center;
    }
  `
  document.head.appendChild(styleElement)
}

const Component: FC<Props> = ({ productUniqueKey, promptGroupUniqueKey }) => {
  const router = useRouter()
  const [product, setProduct] = useState<ProductEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageTitle, setPageTitle] = useState('Product Detail - AKIRA')
  const [pageDescription, setPageDescription] = useState('View product details on AKIRA')
  const [solRate, setSolRate] = useState<number>(0)

  // Fetch promptGroup data
  const { promptGroup, promptGroupIsLoading } = usePromptGroup({
    uniqueKey: promptGroupUniqueKey,
  })

  // SOL/JPYレートを取得
  useEffect(() => {
    const fetchRate = async () => {
      const rate = await getSolJpyRate()
      setSolRate(rate)
    }
    fetchRate()

    // 5分ごとにレートを更新
    const interval = setInterval(fetchRate, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (promptGroupIsLoading || !promptGroup) return

    try {
      // Get products from promptGroup
      const firstPrompt = promptGroup.prompts?.[0]
      if (firstPrompt && firstPrompt.result && Array.isArray(firstPrompt.result.data)) {
        // Find the matching product from the product data array
        const products = firstPrompt.result.data as ProductEntity[]
        const foundProduct = products.find((p) => p.uniqueKey === productUniqueKey)

        if (foundProduct) {
          setProduct(foundProduct)
          // Update page title and description with product info
          setPageTitle(`${foundProduct.title.en} - AKIRA`)
          setPageDescription(
            foundProduct.description
              ? `${foundProduct.description.substring(0, 150)}${
                  foundProduct.description.length > 150 ? '...' : ''
                }`
              : `View ${foundProduct.title.en} on AKIRA`,
          )

          // Update document title dynamically
          document.title = `${foundProduct.title.en} | AKIRA`
        }
      }
    } catch (error) {
      console.error('Failed to find product data:', error)
    } finally {
      setLoading(false)
    }
  }, [promptGroup, productUniqueKey, promptGroupIsLoading, solRate])

  if (loading || promptGroupIsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-border-strong"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div>
        {/* Header */}
        <div className="sticky top-0 z-10 flex w-full items-center justify-between bg-background p-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center justify-center p-2 text-foreground"
              size="icon"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {promptGroup?.chatUniqueKey && (
              <Button
                variant="ghost"
                onClick={() => router.push(`/chats/${promptGroup.chatUniqueKey}`)}
                className="flex items-center justify-center p-2 text-foreground"
                size="icon"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </Button>
            )}
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* <ELogoAkira width={80} height={34} /> */}
          </div>

          <div className="flex items-center gap-2">
            <EShareButton className="static bottom-auto right-auto z-auto" />
            <OThemeChangeButton />
          </div>
        </div>

        <div className="container mx-auto px-4">
          <Card className="p-8 text-center">
            <h1 className="mb-4 text-2xl font-bold text-foreground-strong">Product Not Found</h1>
            <p className="text-foreground">
              Sorry, we couldn&apos;t find the product you&apos;re looking for.
            </p>
            <Button onClick={() => router.back()} className="mt-4">
              Return to Previous Page
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // At this point, product is guaranteed to be non-null due to the if (!product) check above
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {product.imageUrl && <meta property="og:image" content={product.imageUrl} />}
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {product.imageUrl && <meta name="twitter:image" content={product.imageUrl} />}
      </Head>
      <div>
        <OAppHeader
          leftSecond={
            <>
              {promptGroup?.chatUniqueKey && (
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/chats/${promptGroup.chatUniqueKey}`)}
                  className="flex items-center justify-center p-2 text-foreground"
                  size="icon"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </Button>
              )}
            </>
          }
        />

        <div className="container mx-auto max-w-[720px] pb-16">
          <div className="text-center text-sm text-accent-1">RWA</div>
          <div className="mt-3 px-6 text-center">
            <EDotFont text={product.title.en} className="text-foreground-strong" />
          </div>

          <div className="p-3">
            <div
              className="image-container-3d relative mx-auto rounded-xl p-4"
              style={{ height: '300px' }}
            >
              <div className="rotate-y-3d relative z-10 mx-auto h-full w-full max-w-[280px]">
                {product.imageUrl && (
                  <>
                    {/* 表面の画像 */}
                    <img
                      src={product.imageUrl}
                      alt={product.title.en}
                      className="absolute inset-0 h-full w-full rounded-md object-contain shadow-lg"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0.5px)',
                      }}
                    />
                    {/* 裏面の画像（別の画像を使用） */}
                    <img
                      src={'/images/sample/rwa-sample.png'}
                      alt={product.title.en}
                      className="absolute inset-0 h-full w-full rounded-md object-contain shadow-lg"
                      style={{
                        transform: 'rotateY(180deg) translateZ(0.5px)',
                        backfaceVisibility: 'hidden',
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mb-12 mt-6 px-6 text-sm">
            <div className="rounded-lg border border-border bg-background-soft p-4 text-foreground-muted">
              <div className="grid grid-cols-1 gap-3 break-all leading-relaxed">
                <div>
                  <div className="font-bold text-foreground-strong">Storage Location</div>
                  <div>Akira Warehouse</div>
                </div>
                <div>
                  <div className="font-bold text-foreground-strong">Redemption Expiry</div>
                  <div>2025-12-31</div>
                </div>
                <div>
                  <div className="font-bold text-foreground-strong">NFT Address</div>
                  <div className="break-all text-accent-1">
                    3Yf9aXQzUvTx1JmSNoCk7pRWvED5v8EfG4oZNkXZ6aXu
                  </div>
                </div>
                <div>
                  <div className="font-bold text-foreground-strong">Latest Transaction URL</div>
                  <div>
                    <a
                      href="https://explorer.solana.com/tx/5nQxLdKdu74Exz9vH7FaBWNfZYGVc9TSnCqZbrnSRFuB?cluster=mainnet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-accent-1"
                    >
                      https://explorer.solana.com/tx/5nQxLdKdu74Exz9vH7FaBWNfZYGVc9TSnCqZbrnSRFuB?cluster=mainnet
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RPG Style Action Buttons */}
          <div className="mt-auto">
            <div className="fixed bottom-0 left-0 z-10 w-full bg-background-soft p-4 md:relative md:mb-4 md:bg-transparent md:p-0">
              <button
                className="mx-auto flex w-full items-center justify-center gap-2 rounded-lg bg-accent-1 px-4 py-3 text-center text-white transition-transform hover:scale-[1.02] md:w-[320px]"
                onClick={() => {}}
              >
                <span>Redeem Real Item</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export { Component as SProductRwaScreen }

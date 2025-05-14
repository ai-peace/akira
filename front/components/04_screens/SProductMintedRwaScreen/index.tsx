'use client'

import { ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS } from '@/common/domains/types/stock-status'
import { convertJpyToSol, formatCurrency, getSolJpyRate } from '@/common/utils/currency'
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

const Component: FC<Props> = ({ productUniqueKey, promptGroupUniqueKey }) => {
  const router = useRouter()
  const [product, setProduct] = useState<ProductEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageTitle, setPageTitle] = useState('Product Detail - AKIRA')
  const [pageDescription, setPageDescription] = useState('View product details on AKIRA')
  const [solPrice, setSolPrice] = useState<number>(0)
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

          // JPY価格からSOL価格を計算
          if (foundProduct.price && foundProduct.currency === 'JPY') {
            const sol = convertJpyToSol(foundProduct.price, solRate)
            setSolPrice(sol)
          }
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
          <div className="my-6 text-center font-sans text-2xl font-bold text-accent-1">
            YOU’ve Got RWA
          </div>
          <div className="px-6 text-center">
            <EDotFont text={product.title.en} className="text-foreground-subtle" />
          </div>

          <div className="p-3">
            <div className="relative flex w-full items-center justify-center overflow-hidden rounded-lg p-2">
              {product.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.title.en}
                  className="mx-auto h-[220px] w-full object-contain md:h-auto md:max-h-[480px]"
                />
              )}
            </div>
          </div>

          <div className="mb-12 mt-6 px-6 text-sm text-foreground-muted">
            <div className="leading-relaxed">
              This NFT certifies your ownership of a real-world collectible. You can now trade it on
              supported marketplaces or redeem it for the physical item.
            </div>

            <div className="mt-3 break-all leading-relaxed">
              <div className="font-bold">Storage Location</div>
              <div>Akira Warehouse</div>
              <div className="font-bold">Purchase Price</div>
              <div>0.980 SOL (approx. ¥26,000 at time of purchase)</div>
              <div className="font-bold">Redemption Expiry</div>
              <div>2025-12-31</div>
              <div className="font-bold">NFT Address</div>
              <div className="text-accent-1">3Yf9aXQzUvTx1JmSNoCk7pRWvED5v8EfG4oZNkXZ6aXu</div>
              <div className="font-bold">Transaction URL</div>
              <div>
                <a
                  href="https://explorer.solana.com/tx/5nQxLdKdu74Exz9vH7FaBWNfZYGVc9TSnCqZbrnSRFuB?cluster=mainnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-1"
                >
                  https://explorer.solana.com/tx/5nQxLdKdu74Exz9vH7FaBWNfZYGVc9TSnCqZbrnSRFuB?cluster=mainnet
                </a>
              </div>
            </div>
            <div className="mt-4 text-sm text-accent-1">{`Show More >>`}</div>
          </div>
          {/* RPG Style Action Buttons */}
          <div className="mt-auto">
            <div className="fixed bottom-0 left-0 z-10 flex w-full gap-2 bg-background-soft p-4 md:relative md:mb-4 md:grid md:grid-cols-1 md:bg-transparent md:p-0">
              <button
                className={
                  'mx-auto flex w-full items-center justify-center rounded-lg border-2 bg-background-muted px-4 py-3 text-center md:w-[320px]'
                }
                onClick={() => {}}
              >
                Magic Eden
              </button>
              <button
                className={
                  'mx-auto flex w-full items-center justify-center rounded-lg border-2 bg-background-muted px-4 py-3 text-center md:w-[320px]'
                }
                onClick={() => {}}
              >
                Solana Explorer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export { Component as SProductMintedRwaScreen }

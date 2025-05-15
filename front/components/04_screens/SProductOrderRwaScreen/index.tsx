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
  const [isMinting, setIsMinting] = useState(false)

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

  const handleMintClick = () => {
    setIsMinting(true)

    // 一瞬ダミーローダーを表示してから遷移する（500ミリ秒後）
    setTimeout(() => {
      router.push(`/products/${productUniqueKey}/ordering-rwa?pgKey=${promptGroupUniqueKey}`)
    }, 500)
  }

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
          <div className="my-6 text-center font-sans text-2xl font-bold">Deposit & Mint RWA</div>
          <div className="mb-4 text-center text-xl text-foreground-muted">
            To purchase this RWA NFT, you need to deposit{' '}
            <span className="text-accent-1">{formatCurrency(solPrice, 'SOL')}</span>.
          </div>
          <div className="p-3">
            <div className="flex flex-row justify-stretch gap-4 rounded-md bg-background-muted px-3">
              <div className="relative flex w-1/2 items-center justify-center overflow-hidden rounded-lg p-2">
                {product.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.title.en}
                    className="mx-auto h-[220px] w-full object-contain md:h-auto md:max-h-[480px]"
                  />
                )}
              </div>

              {/* Title and Info - Right side on desktop, below image on mobile */}
              <div className="flex w-1/2 flex-col justify-center gap-4 md:h-full md:flex-col md:justify-center md:gap-2 md:pb-4 md:pt-4">
                <div className="text-md mt-4 font-semibold md:my-4 md:text-xl">
                  {product.title.en}
                </div>

                {/* Product Information */}
                <div className={'flex flex-1 flex-col p-1 md:justify-center'}>
                  {/* Price */}
                  <div>
                    <div className="text-2xl font-bold text-accent-1 md:text-3xl">
                      {formatCurrency(solPrice, 'SOL')}
                    </div>
                    <div className="text-sm text-foreground-muted">
                      <EDotFont
                        text={`${product.currency} ${product.price.toLocaleString()}`}
                        className="text-sm text-foreground-muted"
                        animate={true}
                        speed={1}
                        delay={40}
                      />
                    </div>
                  </div>

                  {/* Product Description */}
                  {product.description && (
                    <div className="mb-6 md:mt-4 md:flex-shrink-0">
                      <h2 className="mb-2 text-lg font-semibold text-foreground-strong">
                        <EDotFont text="Description" animate={true} speed={1} delay={60} />
                      </h2>
                      <EDotFont
                        text={product.description}
                        className="text-sm text-foreground"
                        animate={true}
                        speed={1}
                        delay={70}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-12 mt-6 px-6 text-sm text-foreground-muted">
            <div className="mb-2 font-semibold">Please note:</div>
            <div className="leading-relaxed">
              After depositing, it may take up to <span className="text-accent-1">10 minutes</span>{' '}
              to complete the purchase and receive your RWA NFT. Once issued, your NFT will appear
              in your wallet and can be redeemed for the physical item.
            </div>
          </div>
          {/* RPG Style Action Buttons */}
          <div className="mt-auto">
            <div className="fixed bottom-0 left-0 z-10 w-full bg-background-soft p-4 md:relative md:mb-4 md:grid md:grid-cols-1 md:bg-transparent md:p-0">
              {/* View as RWA Button - Full width in the second row */}
              <button
                className={`mx-auto flex w-full items-center justify-center rounded-lg border-2 border-red-600 bg-red-600 px-4 py-3 text-center text-white md:w-[320px] ${
                  product.status === STOCK_STATUS.OUT_OF_STOCK ||
                  product.status === STOCK_STATUS.UNKNOWN ||
                  isMinting
                    ? 'opacity-50'
                    : ''
                }`}
                disabled={
                  product.status === STOCK_STATUS.OUT_OF_STOCK ||
                  product.status === STOCK_STATUS.UNKNOWN ||
                  isMinting
                }
                onClick={handleMintClick}
              >
                {isMinting ? (
                  <div className="flex items-center justify-center">
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  `Mint - ${formatCurrency(solPrice, 'SOL')}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export { Component as SProductOrderRwaScreen }

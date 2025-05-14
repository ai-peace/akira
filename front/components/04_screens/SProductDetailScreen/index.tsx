'use client'

import { ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS, getStockStatusDisplay } from '@/common/domains/types/stock-status'
import EDotFont from '@/front/components/01_elements/EDotFont'
import EShareButton from '@/front/components/01_elements/EShareButton'
import { OAppHeader } from '@/front/components/02_organisms/OAppHeader'
import { OModal } from '@/front/components/02_organisms/OModal'
import { OThemeChangeButton } from '@/front/components/02_organisms/OThemeChangeButton'
import { TProductSearch } from '@/front/components/03_templates/TProductSearch'
import { Button } from '@/front/components/ui/button'
import { Card } from '@/front/components/ui/card'
import { usePromptGroup } from '@/front/hooks/resources/prompt-groups/usePromptGroup'
import { ArrowLeft, Heart, Loader2, Orbit } from 'lucide-react'
import { useTheme } from 'next-themes'
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
  const [hoverButton2, setHoverButton2] = useState(false)
  const [hoverFavorite, setHoverFavorite] = useState(false)
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'
  const [showFavoriteModal, setShowFavoriteModal] = useState(false)
  const [showRwaModal, setShowRwaModal] = useState(false)

  // Fetch promptGroup data
  const { promptGroup, promptGroupIsLoading } = usePromptGroup({
    uniqueKey: promptGroupUniqueKey,
  })

  // Store all products for related products section
  const [allProducts, setAllProducts] = useState<ProductEntity[]>([])

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

        // Store all products for related products section
        setAllProducts(products)
      }
    } catch (error) {
      console.error('Failed to find product data:', error)
    } finally {
      setLoading(false)
    }
  }, [promptGroup, productUniqueKey, promptGroupIsLoading])

  // Function to handle favorite button click
  const handleFavoriteClick = () => {
    setShowFavoriteModal(true)
  }

  // Function to handle RWA NFT button click
  const handleRwaClick = () => {
    setShowRwaModal(true)
  }

  // Close modal handlers
  const handleCloseFavoriteModal = () => {
    setShowFavoriteModal(false)
  }

  const handleCloseRwaModal = () => {
    setShowRwaModal(false)
  }

  // Navigate to waitlist handler
  const handleNavigateToWaitlist = () => {
    setShowFavoriteModal(false)
    setShowRwaModal(false)
    router.push('/waitlists')
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

        <div className="container mx-auto pb-16">
          <div className="px-4 py-4">
            {/* Main Product Layout - Desktop: Image | Title+Info, Mobile: Stacked */}
            <div className="flex flex-col gap-4 md:flex-row md:gap-4">
              {/* Product Image with RPG Style Border - Left side on desktop, full width on mobile */}
              <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-background-muted p-2 md:w-1/2">
                {product.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.title.en}
                    className="mx-auto h-[280px] w-full object-contain md:h-[480px]"
                  />
                )}
              </div>

              {/* Title and Info - Right side on desktop, below image on mobile */}
              <div className="flex flex-col gap-4 md:w-1/2 md:gap-2">
                {/* RPG Style Title Box */}
                <div className="rounded-lg p-1 md:px-4">
                  <div className="mb-2">
                    <EDotFont
                      text={product.title.en}
                      className="text-xl font-bold text-foreground-strong md:text-2xl"
                      animate={true}
                      speed={1}
                      delay={0}
                    />
                  </div>
                  <div>
                    <EDotFont
                      text={product.title.ja}
                      className="text-sm text-foreground-muted"
                      isJapanese={true}
                      animate={true}
                      speed={1}
                      delay={10}
                    />
                  </div>
                </div>

                {/* Favorite Button */}
                <button
                  className={`flex w-full items-center rounded-lg border-2 border-white/0 px-0 py-0 text-left md:px-4 md:py-4 ${
                    hoverFavorite ? (isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/70') : ''
                  }`}
                  onClick={handleFavoriteClick}
                  onMouseEnter={() => setHoverFavorite(true)}
                  onMouseLeave={() => setHoverFavorite(false)}
                >
                  <Heart className="mr-2 h-5 w-5" />
                  <EDotFont
                    text="Add Favorite"
                    className="flex-1"
                    animate={true}
                    speed={1}
                    delay={100}
                  />
                </button>

                {/* Product Information */}
                <div className={'flex flex-1 flex-col rounded-lg bg-background p-1 md:px-4'}>
                  {/* Price */}
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-accent-1">
                      <EDotFont
                        text={`$${Math.round(product.price / 150).toLocaleString()}`}
                        className="text-3xl font-bold text-accent-1"
                        animate={true}
                        speed={1}
                        delay={30}
                      />
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

                  {/* Stock Status */}
                  <div className="mb-6">
                    <div
                      className={`inline-block rounded-full px-3 py-1 text-sm ${
                        product.status === STOCK_STATUS.AVAILABLE
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : product.status === STOCK_STATUS.OUT_OF_STOCK
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      }`}
                    >
                      <EDotFont
                        text={getStockStatusDisplay(product.status, 'en')}
                        animate={true}
                        speed={1}
                        delay={50}
                      />
                    </div>
                  </div>

                  {/* Product Description */}
                  {product.description && (
                    <div className="mb-6">
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

                  {/* Condition */}
                  {product.condition && (
                    <div className="mb-6">
                      <h2 className="mb-2 text-lg font-semibold text-foreground-strong">
                        <EDotFont text="Condition" animate={true} speed={1} delay={80} />
                      </h2>
                      <EDotFont
                        text={product.condition}
                        className="text-sm text-foreground"
                        animate={true}
                        speed={1}
                        delay={90}
                      />
                    </div>
                  )}

                  {/* RPG Style Action Buttons */}
                  <div className="mt-auto">
                    <div className="mb-2 text-lg font-semibold text-foreground-strong">
                      <EDotFont text="Actions" animate={true} speed={1} delay={100} />
                    </div>

                    <div className="fixed bottom-0 left-0 z-10 w-full bg-background-soft p-4 md:relative md:mb-4 md:grid md:grid-cols-1 md:p-0">
                      {/* View as RWA Button - Full width in the second row */}
                      <button
                        className={`flex w-full items-center rounded-lg border-2 border-red-600 px-4 py-3 text-left ${
                          hoverButton2 ? 'bg-red-700 text-white' : 'bg-red-600 text-white'
                        } ${product.status === STOCK_STATUS.OUT_OF_STOCK || product.status === STOCK_STATUS.UNKNOWN ? 'opacity-50' : ''}`}
                        disabled={
                          product.status === STOCK_STATUS.OUT_OF_STOCK ||
                          product.status === STOCK_STATUS.UNKNOWN
                        }
                        onClick={handleRwaClick}
                        onMouseEnter={() => setHoverButton2(true)}
                        onMouseLeave={() => setHoverButton2(false)}
                      >
                        <span className={`mr-2 ${hoverButton2 ? 'opacity-100' : 'opacity-20'}`}>
                          ▶
                        </span>
                        <EDotFont
                          text="Order as RWA"
                          className="flex-1"
                          animate={true}
                          speed={1}
                          delay={100}
                        />
                        <Orbit className="ml-2 h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {allProducts.length > 1 && (
            <div className="mt-8 border-t border-border pt-8">
              <h3 className="mb-6 text-center text-base font-medium text-foreground-strong">
                <EDotFont text="Others" className="text-lg" />
              </h3>
              {promptGroup && (
                <TProductSearch
                  products={allProducts.filter((p) => p.uniqueKey !== productUniqueKey)}
                  chatUniqueKey={promptGroup.chatUniqueKey}
                  promptGroupUniqueKey={promptGroupUniqueKey}
                  showViewAll={false}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Favorite Modal */}
      <OModal
        isOpen={showFavoriteModal}
        onClose={handleCloseFavoriteModal}
        heading={
          <EDotFont
            text="Feature Coming Soon"
            className="text-xl font-bold text-foreground-strong"
            animate={true}
            speed={1}
            delay={0}
          />
        }
        main={
          <EDotFont
            text="We're currently building the favorites feature. Thank you for your interest and patience as we work to enhance your experience."
            className="text-foreground"
            animate={true}
            speed={1}
            delay={50}
          />
        }
        footer={
          <>
            <button
              onClick={handleCloseFavoriteModal}
              className={`w-full rounded-lg border-2 ${
                isDarkMode ? 'border-white/60' : 'border-black/60'
              } px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800`}
            >
              <EDotFont text="Close" animate={true} speed={1} delay={100} />
            </button>
            <button
              onClick={handleNavigateToWaitlist}
              className="w-full rounded-lg border-2 border-accent-1 bg-accent-1 px-4 py-2 text-white hover:bg-accent-1/90"
            >
              <EDotFont text="Join Waitlist" animate={true} speed={1} delay={100} />
            </button>
          </>
        }
      />

      {/* RWA Modal */}
      <OModal
        isOpen={showRwaModal}
        onClose={handleCloseRwaModal}
        heading={
          <EDotFont
            text="Deposit & Mint RWA"
            className="text-xl font-bold text-foreground-strong"
            animate={true}
            speed={1}
            delay={0}
          />
        }
        main={
          <>
            <div>To purchase this RWA NFT, you need to deposit 0.5 SOL.</div>
            {product.imageUrl && (
              <div className="mt-6 flex flex-col gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.imageUrl} alt={product.title.en} className="" />
              </div>
            )}
          </>
        }
        footer={
          <>
            <button
              onClick={handleNavigateToWaitlist}
              className="mb-2 w-full rounded-lg border-2 border-accent-1 bg-accent-1 px-4 py-2 text-white hover:bg-accent-1/90"
            >
              <EDotFont text="NEXT" animate={true} speed={1} delay={100} />
            </button>
            <button
              onClick={handleCloseRwaModal}
              className={`w-full rounded-lg border-2 ${
                isDarkMode ? 'border-white/60' : 'border-black/60'
              } px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800`}
            >
              <EDotFont text="Close" animate={true} speed={1} delay={100} />
            </button>
          </>
        }
      />
    </>
  )
}

export { Component as SProductDetailScreen }

'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProductEntity } from '@/domains/entities/product.entity'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ShoppingCart, Share2, ExternalLink } from 'lucide-react'
import { usePromptGroup } from '@/hooks/resources/prompt-groups/usePromptGroup'
import { LLMResponseEntity } from '@/domains/entities/llm-response.entity'
import { OThemeChangeButton } from '@/components/02_organisms/OThemeChangeButton'
import EShareButton from '@/components/01_elements/EShareButton'
import { TProductSearch } from '@/components/03_templates/TProductSearch'
import ELogoAkira from '@/components/01_elements/ELogoAkira'
import EDotFont from '@/components/01_elements/EDotFont'
import { Metadata } from 'next'
import Head from 'next/head'
import { useTheme } from 'next-themes'

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [product, setProduct] = useState<ProductEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageTitle, setPageTitle] = useState('Product Detail - AKIRA')
  const [pageDescription, setPageDescription] = useState('View product details on AKIRA')
  const [cursorVisible, setCursorVisible] = useState(true)
  const [hoverButton1, setHoverButton1] = useState(false)
  const [hoverButton2, setHoverButton2] = useState(false)
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'

  // Get information from URL parameters
  const productUniqueKey = params.id as string
  const promptGroupUniqueKey = searchParams.get('pgKey') || ''

  // Fetch promptGroup data
  const { promptGroup, promptGroupIsLoading } = usePromptGroup({
    uniqueKey: promptGroupUniqueKey,
  })

  // Store all products for related products section
  const [allProducts, setAllProducts] = useState<ProductEntity[]>([])

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev)
    }, 500)
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

        // Store all products for related products section
        setAllProducts(products)
      }
    } catch (error) {
      console.error('Failed to find product data:', error)
    } finally {
      setLoading(false)
    }
  }, [promptGroup, productUniqueKey, promptGroupIsLoading])

  if (loading || promptGroupIsLoading) {
    return (
      <>
        <Head>
          <title>Loading Product - AKIRA</title>
          <meta name="description" content="Loading product details..." />
        </Head>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-border-strong"></div>
        </div>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Head>
          <title>Product Not Found - AKIRA</title>
          <meta name="description" content="The requested product could not be found." />
        </Head>
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
              <ELogoAkira width={80} height={34} />
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
      </>
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
            <ELogoAkira width={80} height={34} />
          </div>

          <div className="flex items-center gap-2">
            <EShareButton className="static bottom-auto right-auto z-auto" />
            <OThemeChangeButton />
          </div>
        </div>

        <div className="container mx-auto pb-16">
          <div className="px-4 py-4">
            {/* Main Product Layout - Desktop: Image | Title+Info, Mobile: Stacked */}
            <div className="flex flex-col gap-6 md:flex-row md:gap-4">
              {/* Product Image with RPG Style Border - Left side on desktop, full width on mobile */}
              <div
                className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-background-muted p-2 md:w-1/2`}
              >
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
              <div className="flex flex-col gap-4 md:w-1/2">
                {/* RPG Style Title Box */}
                <div className={`rounded-lg p-3`}>
                  <div className="mb-2">
                    <EDotFont
                      text={product.title.en}
                      className="text-xl font-bold text-foreground-strong md:text-2xl"
                      animate={true}
                      speed={3}
                      delay={0}
                    />
                  </div>
                  <div>
                    <EDotFont
                      text={product.title.ja}
                      className="text-sm text-foreground-muted"
                      isJapanese={true}
                      animate={true}
                      speed={2}
                      delay={100}
                    />
                  </div>
                </div>

                {/* Product Information */}
                <div className={`flex flex-1 flex-col rounded-lg bg-background p-4`}>
                  <div className="mb-4 flex items-center">
                    {/* Shop Information */}
                    <div className="flex items-center">
                      {product.shopIconUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.shopIconUrl}
                          alt={product.shopName}
                          className="mr-2 h-5 w-5"
                        />
                      )}
                      <EDotFont
                        text={product.shopName || 'Unknown Shop'}
                        className="text-sm text-foreground-muted"
                        animate={true}
                        speed={2}
                        delay={200}
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-accent-1">
                      <EDotFont
                        text={`$${Math.round(product.price / 150).toLocaleString()}`}
                        className="text-3xl font-bold text-accent-1"
                        animate={true}
                        speed={2}
                        delay={300}
                      />
                    </div>
                    <div className="text-sm text-foreground-muted">
                      <EDotFont
                        text={`${product.currency} ${product.price.toLocaleString()}`}
                        className="text-sm text-foreground-muted"
                        animate={true}
                        speed={2}
                        delay={400}
                      />
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="mb-6">
                    <div
                      className={`inline-block rounded-full px-3 py-1 text-sm ${
                        product.status === 'In Stock'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : product.status === 'Out of Stock'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      }`}
                    >
                      <EDotFont text={product.status} animate={true} speed={2} delay={500} />
                    </div>
                  </div>

                  {/* Product Description */}
                  {product.description && (
                    <div className="mb-6">
                      <h2 className="mb-2 text-lg font-semibold text-foreground-strong">
                        <EDotFont text="Description" animate={true} speed={2} delay={600} />
                      </h2>
                      <EDotFont
                        text={product.description}
                        className="text-sm text-foreground"
                        animate={true}
                        speed={1}
                        delay={700}
                      />
                    </div>
                  )}

                  {/* Condition */}
                  {product.condition && (
                    <div className="mb-6">
                      <h2 className="mb-2 text-lg font-semibold text-foreground-strong">
                        <EDotFont text="Condition" animate={true} speed={2} delay={800} />
                      </h2>
                      <EDotFont
                        text={product.condition}
                        className="text-sm text-foreground"
                        animate={true}
                        speed={1}
                        delay={900}
                      />
                    </div>
                  )}

                  {/* RPG Style Action Buttons */}
                  <div className="mt-auto">
                    <div className="mb-2 text-lg font-semibold text-foreground-strong">
                      <EDotFont text="Actions" animate={true} speed={2} delay={1000} />
                    </div>

                    <div className="mb-4 flex flex-col gap-2 md:flex-row md:gap-4">
                      {/* Purchase Button */}
                      <button
                        className={`flex w-full items-center rounded-lg border-2 ${
                          isDarkMode ? 'border-white/60' : 'border-black/60'
                        } px-4 py-3 text-left ${
                          hoverButton1 ? (isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/70') : ''
                        } ${product.status === 'Out of Stock' ? 'opacity-50' : ''} md:flex-1`}
                        disabled={product.status === 'Out of Stock'}
                        onClick={() => window.open(product.url, '_blank')}
                        onMouseEnter={() => setHoverButton1(true)}
                        onMouseLeave={() => setHoverButton1(false)}
                      >
                        <span className={`mr-2 ${hoverButton1 ? 'opacity-100' : 'opacity-20'}`}>
                          ▶
                        </span>
                        <EDotFont
                          text="Go to Purchase Page"
                          className="flex-1"
                          animate={true}
                          speed={2}
                          delay={1100}
                        />
                        <ShoppingCart className="ml-2 h-5 w-5" />
                      </button>

                      {/* View as RWA Button */}
                      <button
                        className={`flex w-full items-center rounded-lg border-2 border-red-600 px-4 py-3 text-left ${
                          hoverButton2 ? 'bg-red-700 text-white' : 'bg-red-600 text-white'
                        } md:flex-1`}
                        onClick={() => window.open(product.url, '_blank')}
                        onMouseEnter={() => setHoverButton2(true)}
                        onMouseLeave={() => setHoverButton2(false)}
                      >
                        <span className={`mr-2 ${hoverButton2 ? 'opacity-100' : 'opacity-20'}`}>
                          ▶
                        </span>
                        <EDotFont
                          text="Buy as RWA NFT"
                          className="flex-1"
                          animate={true}
                          speed={2}
                          delay={1300}
                        />
                        <ExternalLink className="ml-2 h-5 w-5" />
                      </button>
                    </div>

                    {/* Blinking cursor at the end */}
                    <div className="flex justify-end">
                      <span className={`text-xl ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}>
                        ▼
                      </span>
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
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

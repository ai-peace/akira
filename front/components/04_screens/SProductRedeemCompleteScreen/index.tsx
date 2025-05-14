'use client'

import { ProductEntity } from '@/common/domains/entities/product.entity'
import EDotFont from '@/front/components/01_elements/EDotFont'
import { OAppHeader } from '@/front/components/02_organisms/OAppHeader'
import { Button } from '@/front/components/ui/button'
import { Card } from '@/front/components/ui/card'
import { usePromptGroup } from '@/front/hooks/resources/prompt-groups/usePromptGroup'
import { Award, Sparkles, Star, Trophy } from 'lucide-react'
import Head from 'next/head'
import { useRouter, useSearchParams } from 'next/navigation'
import { FC, useEffect, useState } from 'react'

type Props = {
  productUniqueKey: string
  promptGroupUniqueKey: string
}

const Component: FC<Props> = ({ productUniqueKey, promptGroupUniqueKey }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || 'your email'

  const [product, setProduct] = useState<ProductEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageTitle, setPageTitle] = useState('Redemption Submitted - AKIRA')
  const [pageDescription, setPageDescription] = useState(
    'Your redemption request has been submitted',
  )

  // Fetch promptGroup data
  const { promptGroup, promptGroupIsLoading } = usePromptGroup({
    uniqueKey: promptGroupUniqueKey,
  })

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
          setPageTitle(`Redemption Submitted - ${foundProduct.title.en} - AKIRA`)
          setPageDescription(
            `Your redemption request for ${foundProduct.title.en} has been submitted`,
          )

          // Update document title dynamically
          document.title = `Redemption Submitted - ${foundProduct.title.en} | AKIRA`
        }
      }
    } catch (error) {
      console.error('Failed to find product data:', error)
    } finally {
      setLoading(false)
    }
  }, [promptGroup, productUniqueKey, promptGroupIsLoading])

  if (loading || promptGroupIsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-border-strong"></div>
      </div>
    )
  }

  if (!product) {
    return (
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
    )
  }

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
        <OAppHeader />

        <div className="container mx-auto max-w-[540px] px-4 pb-24 pt-8">
          <div className="mb-8 flex justify-center">
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex items-center justify-center">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-accent-1/10">
                    <Trophy className="h-12 w-12 text-accent-1" strokeWidth={1.5} />
                    <Sparkles
                      className="absolute -right-1 -top-1 h-8 w-8 text-accent-1"
                      strokeWidth={1.5}
                    />
                    <Sparkles
                      className="absolute -bottom-1 -left-1 h-8 w-8 text-accent-1"
                      strokeWidth={1.5}
                    />
                    <Star
                      className="absolute -bottom-3 -right-3 h-10 w-10 rotate-12 text-accent-1"
                      fill="rgba(0,0,0,0.1)"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </div>
              <h1 className="mb-6 text-center text-3xl font-bold uppercase tracking-wider">
                Redemption
                <br />
                Submitted!
              </h1>
            </div>
          </div>

          <div className="mb-8 flex items-start gap-6">
            <div className="flex-shrink-0">
              {product.imageUrl && (
                <div className="h-[120px] w-[120px] overflow-hidden rounded-lg border border-border bg-background-muted p-2">
                  <img
                    src={product.imageUrl}
                    alt={product.title.en}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="mb-1 text-lg font-semibold text-foreground-strong">
                <EDotFont text={product.title.en} />
              </h2>
              <div className="text-sm text-foreground-muted">
                <span className="text-accent-1">RWA NFT</span> - Redemption in progress
              </div>
              <div className="mt-2 text-sm font-medium">
                Your item will be shipped within 5-7 business days.
              </div>
            </div>
          </div>

          <div className="mb-12 space-y-6">
            <div className="mb-9 text-center">
              <p className="text-md text-foreground-strong">
                Thank you, your request has been received.
                <br />
                <span className="mt-2 block">A confirmation email has been sent to:</span>
                <span className="mt-2 block font-semibold text-accent-1">{email}</span>
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background-muted p-4">
              <div className="flex items-start gap-2">
                <span className="mt-1 text-xl">🚚</span>
                <div>
                  <div className="font-medium">Shipping Notice</div>
                  <p className="mt-1 text-sm text-foreground-muted">
                    You will receive shipping updates and tracking info via email once the item is
                    dispatched. Please allow 5-7 business days for processing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 z-10 w-full bg-background-soft p-4 md:relative md:mt-8 md:bg-transparent md:p-0 md:text-center">
            <Button
              onClick={() => router.push('/')}
              className="mx-auto flex h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-border bg-background px-4 py-3 text-center font-semibold uppercase tracking-wider text-foreground transition-transform hover:scale-[1.02] md:w-[320px]"
              variant="outline"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export { Component as SProductRedeemCompleteScreen }

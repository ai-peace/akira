'use client'

import { ProductEntity } from '@/common/domains/entities/product.entity'
import EDotFont from '@/front/components/01_elements/EDotFont'
import { OAppHeader } from '@/front/components/02_organisms/OAppHeader'
import { Button } from '@/front/components/ui/button'
import { Card } from '@/front/components/ui/card'
import { usePromptGroup } from '@/front/hooks/resources/prompt-groups/usePromptGroup'
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

        <div className="container mx-auto max-w-[540px] px-4 pb-16 pt-8">
          <div className="mb-4 flex justify-center">
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <img
                  src="/images/celebration-party-popper.png"
                  alt="Celebration"
                  className="h-20 w-20"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src =
                      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5Z29uIHBvaW50cz0iMTMgMiAzIDE0IDEyIDE0IDExIDIyIDIxIDEwIDEyIDEwIDEzIDIiLz48L3N2Zz4='
                  }}
                />
              </div>
              <h1 className="mb-6 text-center text-3xl font-bold uppercase">
                Redemption
                <br />
                Submitted!
              </h1>
            </div>
          </div>

          <div className="mb-8 flex items-start gap-6">
            <div className="flex-shrink-0">
              {product.imageUrl && (
                <div className="h-[100px] w-[100px] overflow-hidden rounded-lg border border-border bg-background-muted p-2">
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
                {product.title.en}
              </h2>
            </div>
          </div>

          <div className="mb-12 space-y-6 text-center">
            <p className="text-lg text-foreground-strong">
              Thank you, your request has been received.
              <br />
              A confirmation email has been sent to:
              <br />
              <span className="font-semibold text-accent-1">{email}</span>
            </p>

            <div className="rounded-lg border border-border bg-background-muted p-4">
              <div className="flex items-start gap-2">
                <span className="text-xl">🚚</span>
                <div>
                  <h3 className="mb-2 font-semibold">Shipping Notice</h3>
                  <p className="text-sm text-foreground">
                    You will receive shipping updates and tracking info via email once the item is
                    dispatched.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={() => router.push('/')}
              className="px-8 py-3 text-lg"
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

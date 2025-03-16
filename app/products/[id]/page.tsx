'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProductEntity } from '@/domains/entities/product.entity'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { usePromptGroup } from '@/hooks/resources/prompt-groups/usePromptGroup'
import { LLMResponseEntity } from '@/domains/entities/llm-response.entity'

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [product, setProduct] = useState<ProductEntity | null>(null)
  const [loading, setLoading] = useState(true)

  // Get information from URL parameters
  const productUniqueKey = params.id as string
  const promptGroupUniqueKey = searchParams.get('pgKey') || ''

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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Product Image */}
        <div className="relative h-[300px] w-full overflow-hidden rounded-lg md:h-[500px]">
          {product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.title.en}
              className="h-full w-full object-contain"
            />
          )}
        </div>

        {/* Product Information */}
        <div className="flex flex-col">
          <h1 className="mb-2 text-2xl font-bold text-foreground-strong md:text-3xl">
            {product.title.en}
          </h1>
          <p className="mb-4 text-sm text-foreground-muted">{product.title.ja}</p>

          <div className="mb-4 flex items-center">
            {/* Shop Information */}
            <div className="flex items-center">
              {product.shopIconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.shopIconUrl} alt={product.shopName} className="mr-2 h-5 w-5" />
              )}
              <span className="text-sm text-foreground-muted">{product.shopName}</span>
            </div>
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="text-3xl font-bold text-accent-1">
              ${Math.round(product.price / 150).toLocaleString()}
            </div>
            <div className="text-sm text-foreground-muted">
              {product.currency} {product.price.toLocaleString()}
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
              {product.status}
            </div>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold text-foreground-strong">Description</h2>
              <p className="text-sm text-foreground">{product.description}</p>
            </div>
          )}

          {/* Condition */}
          {product.condition && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold text-foreground-strong">Condition</h2>
              <p className="text-sm text-foreground">{product.condition}</p>
            </div>
          )}

          {/* Purchase Button */}
          <div className="mt-auto flex flex-col gap-4 sm:flex-row">
            <Button
              className="flex items-center justify-center"
              disabled={product.status === 'Out of Stock'}
              onClick={() => window.open(product.url, '_blank')}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Go to Purchase Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

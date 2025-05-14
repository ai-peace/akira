'use client'

import { ProductEntity } from '@/common/domains/entities/product.entity'
import { getSolJpyRate } from '@/common/utils/currency'
import EDotFont from '@/front/components/01_elements/EDotFont'
import { OAppHeader } from '@/front/components/02_organisms/OAppHeader'
import { Button } from '@/front/components/ui/button'
import { Card } from '@/front/components/ui/card'
import { Input } from '@/front/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/front/components/ui/select'
import { usePromptGroup } from '@/front/hooks/resources/prompt-groups/usePromptGroup'
import { ChevronDown } from 'lucide-react'
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
  const [pageTitle, setPageTitle] = useState('Redeem Real Item - AKIRA')
  const [pageDescription, setPageDescription] = useState('Redeem your RWA NFT for a physical item')
  const [solRate, setSolRate] = useState<number>(0)

  // フォーム状態
  const [country, setCountry] = useState('USA')
  const [name, setName] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

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
          setPageTitle(`Redeem ${foundProduct.title.en} - AKIRA`)
          setPageDescription(`Redeem your ${foundProduct.title.en} NFT for a physical item`)

          // Update document title dynamically
          document.title = `Redeem ${foundProduct.title.en} | AKIRA`
        }
      }
    } catch (error) {
      console.error('Failed to find product data:', error)
    } finally {
      setLoading(false)
    }
  }, [promptGroup, productUniqueKey, promptGroupIsLoading, solRate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // フォーム送信処理（今回はモックなのでリダイレクトのみ）
    if (promptGroup?.uniqueKey) {
      router.push(
        `/products/${productUniqueKey}/redeem-complete?pgKey=${promptGroup.uniqueKey}&email=${encodeURIComponent(email)}`,
      )
    } else {
      router.push(
        `/products/${productUniqueKey}/redeem-complete?email=${encodeURIComponent(email)}`,
      )
    }
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

        <div className="container mx-auto max-w-[540px] px-4 pb-24 pt-4">
          <h1 className="mb-6 text-center text-2xl font-bold uppercase tracking-wider">
            Redeem Real Item
          </h1>

          <div className="mb-6 flex flex-col md:flex-row md:items-start md:gap-6">
            <div className="mb-4 flex-shrink-0 md:mb-0">
              {product.imageUrl && (
                <div className="mx-auto h-[150px] w-[150px] overflow-hidden rounded-lg border border-border bg-background-muted p-2">
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
                <span className="text-accent-1">RWA NFT</span> - Available for redemption
              </div>
              <div className="mt-2 text-sm font-medium">
                Redemption will be processed within 3-5 business days.
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-border bg-background-muted p-4">
            <div className="flex items-start gap-2">
              <span className="mt-1 text-xl">📦</span>
              <div>
                <div className="font-medium">International Shipping Address Requirements</div>
                <p className="mt-1 text-xs text-foreground-muted">
                  Please provide complete and accurate shipping information to ensure successful
                  delivery. International shipping may be subject to customs fees and import duties.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Country</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-14 w-full">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USA">USA</SelectItem>
                  <SelectItem value="Japan">Japan</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Full Name</label>
              <Input
                className="h-14"
                placeholder="Joe Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Address Line 1
              </label>
              <Input
                className="h-14"
                placeholder="Street address, P.O. box"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Address Line 2 (Optional)
              </label>
              <Input
                className="h-14"
                placeholder="Apartment, suite, unit, building, floor, etc."
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Postal Code</label>
              <Input
                className="h-14"
                placeholder="ZIP / Postal code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Phone Number</label>
              <Input
                className="h-14"
                placeholder="+1 (123) 456-7890"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                className="h-14"
                placeholder="your.email@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </form>

          {/* フッター固定のSubmitボタン */}
          <div className="fixed bottom-0 left-0 z-10 w-full bg-background-soft p-4 md:relative md:mt-8 md:bg-transparent md:p-0">
            <Button
              type="submit"
              onClick={handleSubmit}
              className="mx-auto flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-accent-1 px-4 py-3 text-center text-xl font-semibold uppercase tracking-wider text-white transition-transform hover:scale-[1.02] md:w-[320px]"
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export { Component as SProductRedeemRwaScreen }

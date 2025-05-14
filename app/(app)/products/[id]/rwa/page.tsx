'use client'

import { SProductMintedRwaScreen } from '@/front/components/04_screens/SProductMintedRwaScreen'
import { useParams, useSearchParams } from 'next/navigation'

export default function Page() {
  const params = useParams()
  const searchParams = useSearchParams()

  // Get information from URL parameters
  const productUniqueKey = params?.id as string
  const promptGroupUniqueKey = searchParams?.get('pgKey') || ''

  return (
    <SProductMintedRwaScreen
      productUniqueKey={productUniqueKey}
      promptGroupUniqueKey={promptGroupUniqueKey}
    />
  )
}

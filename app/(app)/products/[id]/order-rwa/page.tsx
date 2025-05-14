'use client'

import { SProductOrderRwaScreen } from '@/front/components/04_screens/SProductOrderRwaScreen'
import { useParams, useSearchParams } from 'next/navigation'

export default function Page() {
  const params = useParams()
  const searchParams = useSearchParams()

  // Get information from URL parameters
  const productUniqueKey = params?.id as string
  const promptGroupUniqueKey = searchParams?.get('pgKey') || ''

  console.log('productUniqueKey-------------', productUniqueKey)
  console.log('promptGroupUniqueKey-------------', promptGroupUniqueKey)

  return (
    <SProductOrderRwaScreen
      productUniqueKey={productUniqueKey}
      promptGroupUniqueKey={promptGroupUniqueKey}
    />
  )
}

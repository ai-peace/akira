'use client'

import { SProductDetailScreen } from '@/front/components/04_screens/SProductDetailScreen'
import { useParams, useSearchParams } from 'next/navigation'

export default function Page() {
  const params = useParams()
  const searchParams = useSearchParams()

  // Get information from URL parameters
  const productUniqueKey = params?.id as string
  const promptGroupUniqueKey = searchParams?.get('pgKey') || ''

  return (
    <SProductDetailScreen
      productUniqueKey={productUniqueKey}
      promptGroupUniqueKey={promptGroupUniqueKey}
    />
  )
}

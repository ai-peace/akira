'use client'

import { SProductRedeemRwaScreen } from '@/front/components/04_screens/SProductRedeemRwaScreen'
import { useParams, useSearchParams } from 'next/navigation'

export default function Page() {
  const params = useParams()
  const searchParams = useSearchParams()

  // Get information from URL parameters
  const productUniqueKey = params?.id as string
  const promptGroupUniqueKey = searchParams?.get('pgKey') || ''

  return (
    <SProductRedeemRwaScreen
      productUniqueKey={productUniqueKey}
      promptGroupUniqueKey={promptGroupUniqueKey}
    />
  )
}

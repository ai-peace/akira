'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SCreateDocumentScreen } from '@/components/04_screens/SCreateDocumentScreen'

const DocumentContent = () => {
  const searchParams = useSearchParams()
  const hasTableOfContent = searchParams.get('table-of-content') === 'true'

  if (hasTableOfContent) {
    return <div>test</div>
  }
  return <SCreateDocumentScreen />
}

const Component = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DocumentContent />
    </Suspense>
  )
}

export default Component

'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SCreateDocumentScreen } from '@/components/04_screens/SCreateDocumentScreen'
// import { SCreateDocumentWithTocScreen } from '@/components/04_screens/SCreateDocumentWithTocScreen'

const DocumentContent = () => {
  const searchParams = useSearchParams()
  const hasTableOfContent = searchParams.get('table-of-content') === 'true'

  if (hasTableOfContent) {
    // return <SCreateDocumentWithTocScreen />
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

'use client'

import { SCreateDocumentScreen } from '@/components/04_screens/SCreateDocumentScreen'
import { Suspense } from 'react'

const DocumentContent = () => {
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

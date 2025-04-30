'use client'

import { SCreateVoiceChatScreen } from '@/front/components/04_screens/SCreateVoiceChatScreen'
import { Suspense } from 'react'

const DocumentContent = () => {
  return <SCreateVoiceChatScreen />
}

const Component = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DocumentContent />
    </Suspense>
  )
}

export default Component

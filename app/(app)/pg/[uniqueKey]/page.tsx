'use client'

import { SSearchResultScreen } from '@/components/04_screens/SSearchResultScreen'
import { useEffect, useState } from 'react'

type Params = {
  params: {
    uniqueKey: string
  }
}

const Page = ({ params }: Params) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <>
      <SSearchResultScreen promptGroupUniqueKey={params.uniqueKey} />
    </>
  )
}

export default Page

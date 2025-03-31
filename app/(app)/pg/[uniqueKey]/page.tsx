'use client'

import { SSearchResultScreen } from '@/front/components/04_screens/SSearchResultScreen'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

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

  if (!isClient)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )

  return (
    <>
      <SSearchResultScreen promptGroupUniqueKey={params.uniqueKey} />
    </>
  )
}

export default Page

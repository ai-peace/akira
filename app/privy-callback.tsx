import { usePrivyAuthentication } from '@/hooks/usePrivyAuthentication'
import { PropsWithChildren } from 'react'

const Component = ({ children }: PropsWithChildren) => {
  usePrivyAuthentication({
    redirectUrl: '/',
  })

  return <>{children}</>
}

export default Component

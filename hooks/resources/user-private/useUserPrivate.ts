import { UserPrivateEntity } from '@/domains/entities/user-private.entity'
import { PrivyAccessTokenRepository } from '@/repository/privy-access-token.repository'
import { userPrivateRepository } from '@/repository/user-private.repository'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

const useUserPrivate = () => {
  const [_, setErrorType] = useState<string | undefined>()
  const { logout } = usePrivy()

  const { data, error, isLoading } = useSWR<UserPrivateEntity | null>(
    [`users`],
    async () => {
      const accessToken = await PrivyAccessTokenRepository.get()
      if (!accessToken) {
        logout()
        toast.error('Login required', {
          description: 'Please login to continue',
        })
        return null
      }
      return await userPrivateRepository.get(accessToken)
    },
    {
      refreshInterval: 1000,
    },
  )

  useEffect(() => {
    if (!error) return
    if (`${error}`.includes('NotFoundError')) {
      setErrorType('NotFoundError')
    } else {
      setErrorType(`UnknownError ${error}`)
    }
  }, [error])

  return {
    userPrivate: data,
    userPrivateError: error,
    userPrivateIsLoading: isLoading,
  }
}

export default useUserPrivate

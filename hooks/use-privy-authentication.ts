import { UserPrivateEntity } from '@/domains/entities/user-private.entity'
import { PrivyAccessTokenRepository } from '@/repository/privy-access-token.repository'
import { userPrivateRepository } from '@/repository/user-private.repository'
import { errorUrl, rootUrl } from '@/utils/url.helper'
import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Variables = {
  redirectUrl?: string
}

export const usePrivyAuthentication = ({ redirectUrl }: Variables = {}) => {
  const { ready, authenticated } = usePrivy()
  const router = useRouter()

  const { login } = useLogin({
    onComplete: async ({ user, isNewUser, wasAlreadyAuthenticated }) => {
      console.log('1')
      const accessToken = await PrivyAccessTokenRepository.get()
      if (!accessToken) {
        logout()
        window.location.href = rootUrl()
        return
      }

      console.log('2')
      if (wasAlreadyAuthenticated) {
        if (redirectUrl) router.push(redirectUrl)
        return
      }

      console.log('3')
      const userPrivate = await userPrivateRepository.get(`${accessToken}`)
      if (!userPrivate) {
        console.log('4')
        const userPrivate = await userPrivateRepository.create(`${accessToken}`)
        if (!userPrivate) {
          window.location.href = errorUrl()
        } else {
          window.location.href = redirectUrl || rootUrl()
        }
      } else {
        router.push(redirectUrl || rootUrl())
      }
    },
    onError: (error: any) => {
      console.error(error)
    },
  })

  const [loginned, setLoginned] = useState<boolean>(false)

  const { logout } = useLogout({
    onSuccess: () => {
      window.location.href = rootUrl()
    },
  })

  useEffect(() => {
    setLoginned(ready && authenticated)
  }, [ready, authenticated, setLoginned])

  const [userPrivate, setUserPrivate] = useState<UserPrivateEntity | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkAndRedirectGuestUser = useCallback(async () => {
    if (isChecking) return

    try {
      setIsChecking(true)

      if (userPrivate) return

      const accessToken = await PrivyAccessTokenRepository.get()
      if (!accessToken) {
        logout()
        window.location.href = rootUrl()
        return
      }

      const fetchedUserPrivate = await userPrivateRepository.get(`${accessToken}`)
      if (!fetchedUserPrivate) {
        window.location.href = errorUrl()
        return
      }

      setUserPrivate(fetchedUserPrivate)
    } finally {
      setIsChecking(false)
    }
  }, [logout, userPrivate, isChecking])

  return {
    login,
    ready,
    authenticated,
    loginned,
    logout,
    checkAndRedirectGuestUser,
  }
}

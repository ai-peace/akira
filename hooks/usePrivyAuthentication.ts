import { UserPrivateEntity } from '@/domains/entities/user-private.entity'
import { PrivyAccessTokenRepository } from '@/repository/privy-access-token.repository'
import { userPrivateRepository } from '@/repository/user-private.repository'
import { userPromptUsageRepository } from '@/repository/user-prompt-usage.repository'
import { errorUrl, rootUrl } from '@/utils/url.helper'
import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useChats } from './resources/chats/useChats'
import useUserPrivate from './resources/user-private/useUserPrivate'
import useUserPromptUsage from './resources/user-prompt-usage/usePromptUsage'
type Variables = {
  redirectUrl?: string
}

// このコンポーネントはSingletonである必要がある
// ログインの際のcallbackがあるため、複数のコンポーネントで使用すると
// ログインのcallbackが複数実行される
export const usePrivyAuthentication = ({ redirectUrl }: Variables = {}) => {
  const { ready, authenticated } = usePrivy()
  const { userPrivateMutate } = useUserPrivate()
  const { chatsMutate } = useChats()
  const { userPromptUsageMutate } = useUserPromptUsage()

  const { login } = useLogin({
    onComplete: async ({ user, isNewUser, wasAlreadyAuthenticated }) => {
      const accessToken = await PrivyAccessTokenRepository.get()
      if (!accessToken) {
        logout()
        window.location.href = rootUrl()
        return
      }

      if (wasAlreadyAuthenticated) return

      const userPrivate = await userPrivateRepository.get(`${accessToken}`)
      userPrivateMutate(userPrivate)
      chatsMutate()
      userPromptUsageMutate()

      if (!userPrivate) {
        const userPrivate = await userPrivateRepository.create(`${accessToken}`)
        if (!userPrivate) {
          // window.location.href = errorUrl()
        } else {
          toast('ログイン成功', {
            description: 'アカウントが作成されました',
          })
        }
      } else {
        toast('ログイン成功', {
          description: 'おかえりなさい！',
        })
      }

      const userPromptUsage = await userPromptUsageRepository.get(`${accessToken}`)
      if (!userPromptUsage) {
        window.location.href = errorUrl()
        return
      }
    },
    onError: (error: any) => {
      console.error(error)
      toast.error('エラー', {
        description: 'ログインに失敗しました',
      })
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

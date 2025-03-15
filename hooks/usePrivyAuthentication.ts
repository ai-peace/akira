import { PrivyAccessTokenRepository } from '@/repository/privy-access-token.repository'
import { userPrivateRepository } from '@/repository/user-private.repository'
import { userPromptUsageRepository } from '@/repository/user-prompt-usage.repository'
import { handleError } from '@/utils/error-handler.helper'
import { errorUrl, getUsersLimitExceedUrl, rootUrl } from '@/utils/url.helper'
import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useChats } from './resources/chats/useChats'
import { useUserPrivate } from './resources/user-private/useUserPrivate'
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
  const router = useRouter()

  const { logout } = useLogout()

  const { login } = useLogin({
    onComplete: async ({ user, isNewUser, wasAlreadyAuthenticated }) => {
      const accessToken = await PrivyAccessTokenRepository.get()
      if (!accessToken) {
        logout()
        window.location.href = rootUrl()
        return
      }

      if (wasAlreadyAuthenticated) return

      let userPrivate = await userPrivateRepository.get(`${accessToken}`)
      if (!userPrivate) {
        try {
          userPrivate = await userPrivateRepository.create(`${accessToken}`)
        } catch (error) {
          logout()
          handleError(error, {
            description:
              'AKIRA has reached its user limit. Please register for the waitlist if you would like to join.',
          })
          router.push(getUsersLimitExceedUrl())
          return
        }
      }

      userPrivateMutate(userPrivate)
      chatsMutate()
      userPromptUsageMutate()

      const userPromptUsage = await userPromptUsageRepository.get(`${accessToken}`)
      if (!userPromptUsage) {
        router.push(errorUrl())
        return
      }

      toast.success('Welcome back!', {
        description: 'login success',
      })
    },
    onError: (error: any) => {
      console.error(error)
      toast.error('Error', {
        description: 'login failed',
      })
    },
  })

  return {
    login,
    ready,
    authenticated,
  }
}

import { UserPrivateEntity } from '@/common/domains/entities/user-private.entity'
import { PrivyAccessTokenRepository } from '@/front/repositories/privy-access-token.repository'
import { userPrivateRepository } from '@/front/repositories/user-private.repository'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect } from 'react'
import useSWR from 'swr'

const useUserPrivate = () => {
  const { logout } = usePrivy()

  const { data, error, isLoading, mutate } = useSWR<UserPrivateEntity | null>(
    [`users`],
    async () => {
      const accessToken = await PrivyAccessTokenRepository.get()
      if (!accessToken) return null
      return await userPrivateRepository.get(accessToken)
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000, // 5秒間は重複リクエストを防ぐ
      refreshInterval: 30000, // 30秒ごとに自動更新
    },
  )

  // localStorage内のトークンの変更を検知してリロードする
  useEffect(() => {
    const handleStorageChange = () => {
      mutate()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [mutate])

  const updateUserPrivate = async (data: UserPrivateEntity) => {
    const accessToken = await PrivyAccessTokenRepository.get()
    if (!accessToken) {
      logout()
      return
    }

    try {
      const updatedUserPrivate = await userPrivateRepository.update(accessToken, data)
      mutate(updatedUserPrivate, false)
    } catch (error) {
      console.error('Error updating user private:', error)
      throw error
    }
  }

  return {
    userPrivate: data,
    userPrivateError: error,
    userPrivateIsLoading: isLoading,
    userPrivateMutate: mutate,
    updateUserPrivate,
  }
}

export { useUserPrivate }

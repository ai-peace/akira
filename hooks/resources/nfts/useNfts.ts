import { PrivyAccessTokenRepository } from '@/repository/privy-access-token.repository'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

type NFT = {
  id: number
  uniqueKey: string
  mintAddress: string
  metadata: string
  productId: string
  walletAddress: string
  createdAt: string
}

export const useNfts = () => {
  const [errorType, setErrorType] = useState<string | undefined>()

  const { data, error, isLoading, mutate } = useSWR<{ nfts: NFT[] } | null>(
    'my-nfts',
    async () => {
      try {
        // Privyのアクセストークンを取得
        const accessToken = await PrivyAccessTokenRepository.get()
        if (!accessToken) {
          throw new Error('認証情報が取得できませんでした')
        }

        const response = await fetch('/api/my-nfts', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || 'NFTの取得に失敗しました')
        }

        const data = await response.json()

        if (data.data && data.data.nfts) {
          return data.data
        }

        return { nfts: [] }
      } catch (err) {
        console.error('NFT取得エラー:', err)
        throw err
      }
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  )

  // エラーハンドリング
  useEffect(() => {
    if (!error) return
    if (`${error}`.includes('認証情報が取得できませんでした')) {
      setErrorType('AuthError')
    } else {
      setErrorType(`UnknownError ${error}`)
    }
  }, [error])

  return {
    nfts: data?.nfts || [],
    nftsIsLoading: isLoading,
    nftsError: errorType,
    refreshNfts: mutate,
  }
}

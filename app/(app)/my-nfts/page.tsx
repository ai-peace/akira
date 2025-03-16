'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { usePrivy } from '@privy-io/react-auth'
import EDotFont from '@/components/01_elements/EDotFont'
import { OWalletConnect } from '@/components/02_organisms/OWalletConnect'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { PrivyAccessTokenRepository } from '@/repository/privy-access-token.repository'

// 直接定義
const SOLANA_EXPLORER_URL = 'https://explorer.solana.com'

type NFT = {
  id: number
  uniqueKey: string
  mintAddress: string
  metadata: string
  productId: string
  walletAddress: string
  createdAt: string
}

export default function MyNFTsPage() {
  const { authenticated } = usePrivy()
  const { publicKey } = useWallet()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authenticated && publicKey) {
      fetchNFTs()
    } else {
      setLoading(false)
    }
  }, [authenticated, publicKey])

  const fetchNFTs = async () => {
    try {
      setError(null)

      // Privyのアクセストークンを取得
      console.log('Privyアクセストークンの取得を試みます...')
      const accessToken = await PrivyAccessTokenRepository.get()
      console.log(`アクセストークン取得結果: ${accessToken ? '成功' : '失敗'}`)

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
      console.log('NFT取得結果:', data)

      if (data.data && data.data.nfts) {
        setNfts(data.data.nfts)
      } else {
        setNfts([])
      }
    } catch (err) {
      console.error('NFT取得エラー:', err)
      setError(err instanceof Error ? err.message : 'NFTの取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <div className="mb-4 text-center">
          <EDotFont
            text="Please login to view your NFTs"
            className="text-xl font-bold"
            animate={true}
            speed={1}
          />
        </div>
        <div className="text-center">
          <EDotFont
            text="You need to be logged in to view your NFT collection."
            animate={true}
            speed={1}
            delay={50}
          />
        </div>
      </div>
    )
  }

  if (!publicKey) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <div className="mb-4 text-center">
          <EDotFont
            text="Connect your wallet to view your NFTs"
            className="text-xl font-bold"
            animate={true}
            speed={1}
          />
        </div>
        <div className="mb-6 text-center">
          <EDotFont
            text="You need to connect your Solana wallet to view your NFT collection."
            animate={true}
            speed={1}
            delay={50}
          />
        </div>
        <OWalletConnect />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-2xl font-bold">
        <EDotFont text="My RWA NFTs" animate={true} speed={1} />
      </h1>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent-1 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950">
          <EDotFont
            text="Error loading NFTs"
            className="text-lg text-red-600 dark:text-red-400"
            animate={true}
            speed={1}
          />
          <p className="mt-4 text-red-500 dark:text-red-300">{error}</p>
          <button
            onClick={fetchNFTs}
            className="mt-4 rounded-lg border-2 border-accent-1 bg-accent-1 px-4 py-2 text-white hover:bg-accent-1/90"
          >
            <EDotFont text="Try Again" animate={true} speed={1} />
          </button>
        </div>
      ) : nfts.length === 0 ? (
        <div className="rounded-lg border-2 p-8 text-center">
          <EDotFont
            text="You don't have any NFTs yet"
            className="text-lg"
            animate={true}
            speed={1}
          />
          <p className="mt-4 text-foreground-muted">
            Purchase RWA NFTs from the product pages to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {nfts.map((nft) => (
            <div
              key={nft.uniqueKey}
              className="overflow-hidden rounded-lg border-2 bg-background-muted"
            >
              <div className="p-4">
                <h2 className="mb-2 text-lg font-semibold">
                  <EDotFont text={`NFT #${nft.id}`} animate={true} speed={1} />
                </h2>
                <div className="mb-4 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-foreground-muted">Mint Address:</span>
                  </div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {nft.mintAddress.substring(0, 8)}...
                    {nft.mintAddress.substring(nft.mintAddress.length - 8)}
                  </div>
                </div>
                <div className="mb-4 text-sm">
                  <div className="mb-1 text-foreground-muted">Created:</div>
                  <div>{new Date(nft.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex justify-between">
                  <Link
                    href={`${SOLANA_EXPLORER_URL}/${nft.mintAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-accent-1 hover:underline"
                  >
                    <span className="mr-1">View on Explorer</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useSession } from 'next-auth/react'
import EDotFont from '@/components/01_elements/EDotFont'
import { OWalletConnect } from '@/components/02_organisms/OWalletConnect'
import { SOLANA_EXPLORER_URL } from '@/config/solana.config'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

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
  const { data: session } = useSession()
  const { publicKey } = useWallet()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session && publicKey) {
      fetchNFTs()
    } else {
      setLoading(false)
    }
  }, [session, publicKey])

  const fetchNFTs = async () => {
    try {
      const response = await fetch(`/api/my-nfts?wallet=${publicKey?.toString()}`)
      const data = await response.json()
      setNfts(data.nfts || [])
    } catch (error) {
      console.error('NFT取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
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

'use client'

import EDotFont from '@/components/01_elements/EDotFont'
import { OWalletConnect } from '@/components/02_organisms/OWalletConnect'
import { useNfts } from '@/hooks/resources/nfts/useNfts'
import { usePrivy } from '@privy-io/react-auth'
import { useWallet } from '@solana/wallet-adapter-react'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// 直接定義
const SOLANA_EXPLORER_URL = 'https://explorer.sonic.game'

export default function MyNFTsPage() {
  const { authenticated } = usePrivy()
  const { publicKey } = useWallet()
  const { nfts, nftsIsLoading, nftsError, refreshNfts } = useNfts()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (authenticated && publicKey) {
      refreshNfts()
    }
  }, [authenticated, publicKey, refreshNfts])

  if (!isClient) {
    return (
      <div className="flex h-full w-full flex-col overflow-y-auto p-4 md:p-4">
        <h1 className="mb-4 text-2xl font-bold">
          <EDotFont text="My RWA NFTs" animate={false} speed={1} />
        </h1>
        <div className="flex h-40 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent-1 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-4">
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
      <div className="mt-8 flex h-full w-full flex-col items-center justify-center gap-4 p-4">
        <div className="mb-2 text-center">
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
    <div className="mt-8 flex h-full w-full flex-col overflow-y-auto p-4 md:p-4">
      <h1 className="mb-4 text-2xl font-bold">
        <EDotFont text="My RWA NFTs" animate={true} speed={1} />
      </h1>

      {nftsIsLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent-1 border-t-transparent"></div>
        </div>
      ) : nftsError ? (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950">
          <EDotFont
            text="Error loading NFTs"
            className="text-lg text-red-600 dark:text-red-400"
            animate={true}
            speed={1}
          />
          <p className="mt-4 text-red-500 dark:text-red-300">{nftsError}</p>
          <button
            onClick={() => refreshNfts()}
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
          {nfts.map((nft) => {
            let metadataObj: any = {}
            try {
              metadataObj = JSON.parse(nft.metadata || '{}')
            } catch (err) {
              console.error('Error parsing NFT metadata:', err)
            }
            const imageUrl = metadataObj.image

            return (
              <div
                key={nft.uniqueKey}
                className="overflow-hidden rounded-lg border-2 bg-background-muted"
              >
                <div className="p-4">
                  {imageUrl && (
                    <div className="mb-4 flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt={`NFT #${nft.id}`}
                        className="max-h-60 w-auto object-contain"
                      />
                    </div>
                  )}

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
                    {/* ExplorerのURLを「/address/〜」形式に修正 */}
                    <Link
                      href={`${SOLANA_EXPLORER_URL}/address/${nft.mintAddress}`}
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
            )
          })}
        </div>
      )}
    </div>
  )
}

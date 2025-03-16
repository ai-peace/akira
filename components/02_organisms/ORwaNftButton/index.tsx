import { FC, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { ProductEntity } from '@/domains/entities/product.entity'
import EDotFont from '@/components/01_elements/EDotFont'
import { ExternalLink, X, ShoppingCart } from 'lucide-react'
import { useDeposit } from '@/hooks/useDeposit'
import { OWalletConnect } from '../OWalletConnect'

// デモモード用の固定SOL金額
const DEMO_SOL_AMOUNT = 0.001

type Props = {
  product: ProductEntity
}

const Component: FC<Props> = ({ product }) => {
  const router = useRouter()
  const { authenticated } = usePrivy()
  const { publicKey } = useWallet()
  const { deposit, isLoading: depositLoading, error: depositError } = useDeposit()

  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<
    'initial' | 'connect' | 'deposit' | 'minting' | 'success' | 'error'
  >('initial')
  const [error, setError] = useState<string | null>(null)
  const [mintAddress, setMintAddress] = useState<string | null>(null)

  const handleClick = () => {
    if (!authenticated) {
      setStep('initial')
      setShowModal(true)
      return
    }

    if (!publicKey) {
      setStep('connect')
      setShowModal(true)
      return
    }

    setStep('deposit')
    setShowModal(true)
  }

  const handleDeposit = async () => {
    if (!publicKey) {
      setStep('connect')
      return
    }

    setError(null)

    // デモモードでは固定の0.001 SOLを使用
    const solAmount = DEMO_SOL_AMOUNT

    const success = await deposit(solAmount)
    if (success) {
      handleMintNFT()
    } else {
      setStep('error')
      setError(depositError || 'デポジットに失敗しました')
    }
  }

  const handleMintNFT = async () => {
    if (!publicKey) return

    setStep('minting')

    try {
      const response = await fetch('/api/mint-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.uniqueKey,
          walletAddress: publicKey.toString(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMintAddress(data.mintAddress)
        setStep('success')
      } else {
        setStep('error')
        setError(data.error || 'NFT発行に失敗しました')
      }
    } catch (err) {
      setStep('error')
      setError('サーバーエラーが発生しました')
    }
  }

  const handleClose = () => {
    setShowModal(false)
    setStep('initial')
    setError(null)
  }

  const renderModalContent = () => {
    switch (step) {
      case 'initial':
        return (
          <>
            <div className="mb-4 text-center">
              <EDotFont
                text="Join Waitlist"
                className="text-xl font-bold text-foreground-strong"
                animate={true}
                speed={1}
                delay={0}
              />
            </div>

            <div className="mb-6 text-center">
              <EDotFont
                text="Please sign in to continue with RWA NFT purchase."
                className="text-foreground"
                animate={true}
                speed={1}
                delay={50}
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <button
                onClick={handleClose}
                className="w-full rounded-lg border-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <EDotFont text="Close" animate={true} speed={1} delay={100} />
              </button>

              <button
                onClick={() => {
                  handleClose()
                  router.push('/waitlists')
                }}
                className="w-full rounded-lg border-2 border-accent-1 bg-accent-1 px-4 py-2 text-white hover:bg-accent-1/90"
              >
                <EDotFont text="Join Waitlist" animate={true} speed={1} delay={100} />
              </button>
            </div>
          </>
        )

      case 'connect':
        return (
          <>
            <div className="mb-4 text-center">
              <EDotFont
                text="Connect Wallet"
                className="text-xl font-bold text-foreground-strong"
                animate={true}
                speed={1}
                delay={0}
              />
            </div>

            <div className="mb-6 text-center">
              <EDotFont
                text="Please connect your Solana wallet to continue with RWA NFT purchase."
                className="text-foreground"
                animate={true}
                speed={1}
                delay={50}
              />
            </div>

            <div className="mb-6 flex justify-center">
              <OWalletConnect />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="w-full rounded-lg border-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <EDotFont text="Close" animate={true} speed={1} delay={100} />
              </button>
            </div>
          </>
        )

      case 'deposit':
        return (
          <>
            <div className="mb-4 text-center">
              <EDotFont
                text="Deposit SOL"
                className="text-xl font-bold text-foreground-strong"
                animate={true}
                speed={1}
                delay={0}
              />
            </div>

            <div className="mb-2 text-center">
              <EDotFont
                text={`To purchase this RWA NFT, you need to deposit ${DEMO_SOL_AMOUNT} SOL.`}
                className="text-foreground"
                animate={true}
                speed={1}
                delay={50}
              />
            </div>

            <div className="mb-6 text-center">
              <EDotFont
                text="(Demo Mode: Reduced price for testing)"
                className="text-sm text-accent-1"
                animate={true}
                speed={1}
                delay={100}
              />
            </div>

            <div className="mb-4 rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-foreground-muted">Product:</span>
                <span className="font-medium">{product.title.en}</span>
              </div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-foreground-muted">Price:</span>
                <span className="font-medium">
                  {product.currency} {product.price.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-muted">Deposit Amount:</span>
                <span className="font-medium">{DEMO_SOL_AMOUNT} SOL</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDeposit}
                disabled={depositLoading}
                className="w-full rounded-lg border-2 border-accent-1 bg-accent-1 px-4 py-2 text-white hover:bg-accent-1/90 disabled:opacity-50"
              >
                <EDotFont
                  text={depositLoading ? 'Processing...' : 'Deposit & Mint NFT'}
                  animate={true}
                  speed={1}
                  delay={100}
                />
              </button>

              <button
                onClick={handleClose}
                disabled={depositLoading}
                className="w-full rounded-lg border-2 px-4 py-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
              >
                <EDotFont text="Cancel" animate={true} speed={1} delay={100} />
              </button>
            </div>
          </>
        )

      case 'minting':
        return (
          <>
            <div className="mb-4 text-center">
              <EDotFont
                text="Minting NFT"
                className="text-xl font-bold text-foreground-strong"
                animate={true}
                speed={1}
                delay={0}
              />
            </div>

            <div className="mb-6 text-center">
              <EDotFont
                text="Please wait while we mint your RWA NFT. This may take a few moments."
                className="text-foreground"
                animate={true}
                speed={1}
                delay={50}
              />
            </div>

            <div className="mb-6 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent-1 border-t-transparent"></div>
            </div>
          </>
        )

      case 'success':
        return (
          <>
            <div className="mb-4 text-center">
              <EDotFont
                text="Success!"
                className="text-xl font-bold text-foreground-strong"
                animate={true}
                speed={1}
                delay={0}
              />
            </div>

            <div className="mb-6 text-center">
              <EDotFont
                text="Your RWA NFT has been successfully minted and sent to your wallet."
                className="text-foreground"
                animate={true}
                speed={1}
                delay={50}
              />
            </div>

            {mintAddress && (
              <div className="mb-6 overflow-hidden rounded-lg border p-4">
                <div className="mb-2 text-sm text-foreground-muted">NFT Address:</div>
                <div className="break-all text-xs">{mintAddress}</div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleClose}
                className="w-full rounded-lg border-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <EDotFont text="Close" animate={true} speed={1} delay={100} />
              </button>

              <button
                onClick={() => {
                  handleClose()
                  router.push('/my-nfts')
                }}
                className="w-full rounded-lg border-2 border-accent-1 bg-accent-1 px-4 py-2 text-white hover:bg-accent-1/90"
              >
                <EDotFont text="View My NFTs" animate={true} speed={1} delay={100} />
              </button>
            </div>
          </>
        )

      case 'error':
        return (
          <>
            <div className="mb-4 text-center">
              <EDotFont
                text="Error"
                className="text-xl font-bold text-foreground-strong"
                animate={true}
                speed={1}
                delay={0}
              />
            </div>

            <div className="mb-6 text-center">
              <EDotFont
                text={error || 'An error occurred during the process. Please try again.'}
                className="text-foreground"
                animate={true}
                speed={1}
                delay={50}
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="w-full rounded-lg border-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <EDotFont text="Close" animate={true} speed={1} delay={100} />
              </button>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <>
      <button
        className="flex w-full items-center rounded-lg border-2 border-red-600 bg-red-600 px-4 py-3 text-left text-white hover:bg-red-700 md:w-1/3"
        onClick={handleClick}
      >
        <span className="mr-2 opacity-20">▶</span>
        <EDotFont text="Buy as RWA NFT" className="flex-1" animate={true} speed={1} delay={100} />
        <ExternalLink className="ml-2 h-5 w-5" />
      </button>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 max-w-md rounded-lg border-2 bg-background p-6 shadow-lg">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-foreground hover:text-foreground-muted"
              disabled={step === 'minting'}
            >
              <X className="h-5 w-5" />
            </button>

            {renderModalContent()}
          </div>
        </div>
      )}
    </>
  )
}

export const ORwaNftButton = Component

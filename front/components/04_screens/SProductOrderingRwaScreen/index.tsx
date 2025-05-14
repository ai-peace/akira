'use client'

import { ProductEntity } from '@/common/domains/entities/product.entity'
import { convertJpyToSol, getSolJpyRate } from '@/common/utils/currency'
import EDotFont from '@/front/components/01_elements/EDotFont'
import { OAppHeader } from '@/front/components/02_organisms/OAppHeader'
import { Button } from '@/front/components/ui/button'
import { usePromptGroup } from '@/front/hooks/resources/prompt-groups/usePromptGroup'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, CircleDashed, Loader2 } from 'lucide-react'
import Head from 'next/head'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'

type Props = {
  productUniqueKey: string
  promptGroupUniqueKey: string
}

const Component: FC<Props> = ({ productUniqueKey, promptGroupUniqueKey }) => {
  const router = useRouter()
  const [product, setProduct] = useState<ProductEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageTitle, setPageTitle] = useState('Product Detail - AKIRA')
  const [pageDescription, setPageDescription] = useState('View product details on AKIRA')
  const [solPrice, setSolPrice] = useState<number>(0)
  const [solRate, setSolRate] = useState<number>(0)

  // Fetch promptGroup data
  const { promptGroup, promptGroupIsLoading } = usePromptGroup({
    uniqueKey: promptGroupUniqueKey,
  })

  // SOL/JPYレートを取得
  useEffect(() => {
    const fetchRate = async () => {
      const rate = await getSolJpyRate()
      setSolRate(rate)
    }
    fetchRate()

    // 5分ごとにレートを更新
    const interval = setInterval(fetchRate, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (promptGroupIsLoading || !promptGroup) return

    try {
      // Get products from promptGroup
      const firstPrompt = promptGroup.prompts?.[0]
      if (firstPrompt && firstPrompt.result && Array.isArray(firstPrompt.result.data)) {
        // Find the matching product from the product data array
        const products = firstPrompt.result.data as ProductEntity[]
        const foundProduct = products.find((p) => p.uniqueKey === productUniqueKey)

        if (foundProduct) {
          setProduct(foundProduct)
          // Update page title and description with product info
          setPageTitle(`${foundProduct.title.en} - AKIRA`)
          setPageDescription(
            foundProduct.description
              ? `${foundProduct.description.substring(0, 150)}${
                  foundProduct.description.length > 150 ? '...' : ''
                }`
              : `View ${foundProduct.title.en} on AKIRA`,
          )

          // Update document title dynamically
          document.title = `${foundProduct.title.en} | AKIRA`

          // JPY価格からSOL価格を計算
          if (foundProduct.price && foundProduct.currency === 'JPY') {
            const sol = convertJpyToSol(foundProduct.price, solRate)
            setSolPrice(sol)
          }
        }
      }
    } catch (error) {
      console.error('Failed to find product data:', error)
    } finally {
      setLoading(false)
    }
  }, [promptGroup, productUniqueKey, promptGroupIsLoading, solRate])

  // Add current step state
  const [currentStep, setCurrentStep] = useState(0)
  const steps = [
    {
      title: 'Deposit',
      description: 'Send SOL to the escrow account',
    },
    {
      title: 'Processing',
      description: 'Processing your purchase',
    },
    {
      title: 'Minting',
      description: 'Creating your RWA NFT',
    },
  ]

  if (loading || promptGroupIsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-border-strong"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <>
        <div>Product not found</div>
      </>
    )
  }

  // At this point, product is guaranteed to be non-null due to the if (!product) check above
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {product.imageUrl && <meta property="og:image" content={product.imageUrl} />}
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {product.imageUrl && <meta name="twitter:image" content={product.imageUrl} />}
      </Head>
      <div>
        <OAppHeader
          leftSecond={
            <>
              {promptGroup?.chatUniqueKey && (
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/chats/${promptGroup.chatUniqueKey}`)}
                  className="flex items-center justify-center p-2 text-foreground"
                  size="icon"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </Button>
              )}
            </>
          }
        />

        <div className="mx-auto max-w-[480px] pb-16">
          <div>
            <EDotFont text={'Minting RWA...'} className="text-2xl font-bold" />
          </div>
          <div>
            <EDotFont text={product.title.en} className="text-foreground-subtle" />
          </div>
          <div className="mx-auto mt-8">
            <VerticalStepper steps={steps} currentStep={currentStep} />
          </div>
        </div>
      </div>
    </>
  )
}

export { Component as SProductOrderingRwaScreen }

// Stepper component
type StepStatus = 'completed' | 'current' | 'upcoming'

interface StepProps {
  title: string
  description?: string
  status: StepStatus
  isLastStep?: boolean
  isProcessing?: boolean
}

// キーフレームアニメーションをグローバルスタイルとして追加
const styleElement = typeof document !== 'undefined' ? document.createElement('style') : null
if (styleElement) {
  styleElement.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }
    
    @keyframes dotPulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    
    .processing-dots::after {
      content: '';
      animation: dotPulse 1.5s infinite;
    }
    
    .processing-dots[data-dot="1"]::after {
      content: '.';
    }
    
    .processing-dots[data-dot="2"]::after {
      content: '..';
    }
    
    .processing-dots[data-dot="3"]::after {
      content: '...';
    }
  `
  document.head.appendChild(styleElement)
}

const Step: FC<StepProps> = ({
  title,
  description,
  status,
  isLastStep = false,
  isProcessing = false,
}) => {
  const [dotCount, setDotCount] = useState(1)

  // プロセッシングアニメーションのドットカウント
  useEffect(() => {
    if (!isProcessing) return

    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1)
    }, 500)

    return () => clearInterval(interval)
  }, [isProcessing])

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full border-2 border-border',
            isProcessing && 'border-accent-1',
          )}
        >
          {status === 'completed' ? (
            <CheckCircle2 className="h-6 w-6 text-accent-1" />
          ) : status === 'current' ? (
            isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin text-accent-1" />
            ) : (
              <Circle className="h-6 w-6 text-accent-1" />
            )
          ) : (
            <CircleDashed className="h-6 w-6 text-foreground-muted" />
          )}
        </div>
        {!isLastStep && (
          <div
            className={cn(
              'h-10 w-0.5',
              status === 'completed'
                ? 'bg-accent-1'
                : status === 'current' && isProcessing
                  ? 'bg-gradient-to-b from-accent-1 to-border'
                  : 'bg-border',
            )}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col pb-8">
        <div
          className={cn(
            'text-sm font-medium',
            status === 'completed'
              ? 'text-accent-1'
              : status === 'current'
                ? 'text-foreground-strong'
                : 'text-foreground-muted',
            isProcessing && 'animate-pulse',
          )}
        >
          {title}
          {isProcessing && <span className="processing-dots ml-1" data-dot={dotCount}></span>}
        </div>
        {description && (
          <div
            className={cn('mt-1 text-sm text-foreground-muted', isProcessing && 'animate-pulse')}
          >
            {description}
          </div>
        )}
        {isProcessing && (
          <div className="mt-2 flex space-x-1.5">
            <div
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-1"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-1"
              style={{ animationDelay: '300ms' }}
            ></div>
            <div
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-1"
              style={{ animationDelay: '600ms' }}
            ></div>
          </div>
        )}
      </div>
    </div>
  )
}

const VerticalStepper: FC<{
  steps: Array<{ title: string; description?: string }>
  currentStep: number
}> = ({ steps, currentStep }) => {
  return (
    <div className="flex flex-col gap-1">
      {steps.map((step, index) => (
        <Step
          key={index}
          title={step.title}
          description={step.description}
          status={
            index < currentStep ? 'completed' : index === currentStep ? 'current' : 'upcoming'
          }
          isLastStep={index === steps.length - 1}
          isProcessing={index === currentStep && index === 1} // Processingステップの場合のみアニメーション表示
        />
      ))}
    </div>
  )
}

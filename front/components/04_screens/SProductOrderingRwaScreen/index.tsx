'use client'

import { ProductEntity } from '@/common/domains/entities/product.entity'
import EDotFont from '@/front/components/01_elements/EDotFont'
import { OAppHeader } from '@/front/components/02_organisms/OAppHeader'
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

  // Fetch promptGroup data
  const { promptGroup, promptGroupIsLoading } = usePromptGroup({
    uniqueKey: promptGroupUniqueKey,
  })

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

  // 自動的にステップを進める
  useEffect(() => {
    // 最初のステップ（Deposit）を3秒後に完了し、次へ
    const depositTimer = setTimeout(() => {
      setCurrentStep(1) // Processingステップへ
    }, 3000)

    // Processingステップを60秒後に完了し、次へ
    const processingTimer = setTimeout(() => {
      setCurrentStep(2) // Mintingステップへ
    }, 3000 + 60000) // 3秒 + 60秒後

    // Mintingステップを10秒後に完了し、リダイレクト
    const mintingTimer = setTimeout(
      () => {
        // 最終的なリダイレクト先
        if (promptGroup?.uniqueKey) {
          router.push(`/products/${productUniqueKey}/minted?pgKey=${promptGroup.uniqueKey}`)
        } else {
          router.push(`/products/${productUniqueKey}/minted`)
        }
      },
      3000 + 60000 + 10000 + 100000000,
    ) // 3秒 + 60秒 + 10秒後

    // クリーンアップ
    return () => {
      clearTimeout(depositTimer)
      clearTimeout(processingTimer)
      clearTimeout(mintingTimer)
    }
  }, [productUniqueKey, promptGroup, router])

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
        }
      }
    } catch (error) {
      console.error('Failed to find product data:', error)
    } finally {
      setLoading(false)
    }
  }, [promptGroup, productUniqueKey, promptGroupIsLoading])

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
        <OAppHeader leftFirst={<></>} leftSecond={<></>} rightFirst={<></>} />

        <div className="mx-auto max-w-[480px] px-6 pb-16">
          <div className="mb-2 text-center">
            <EDotFont text={'Minting RWA'} className="title-dots relative text-2xl font-bold" />
          </div>
          <div className="text-center">
            <EDotFont text={product.title.en} className="text-foreground-subtle" />
          </div>
          {product.imageUrl && (
            <div className="image-container-3d relative mx-auto mt-4 rounded-xl p-4">
              <div className="rotate-y-3d relative z-10 mx-auto h-64 w-64">
                <img
                  src={product.imageUrl}
                  alt={product.title.en}
                  className="absolute h-full w-full rounded-md object-contain"
                  style={{ backfaceVisibility: 'visible' }}
                />
              </div>
            </div>
          )}
          <div className="border-border-fain mx-auto mt-8 rounded-lg border bg-background-soft p-6">
            <VerticalStepper steps={steps} currentStep={currentStep} />
          </div>

          <div className="mx-auto mt-6 max-w-[400px] text-center">
            <p className="fade-in-out text-sm text-foreground-muted">
              AKIRA is making this purchase on your behalf.{' '}
              <span className="text-accent-1">This process may take up to 10 minutes.</span>
            </p>
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
    
    @keyframes titleDots {
      0% { content: '.'; }
      33% { content: '..'; }
      66% { content: '...'; }
      100% { content: '.'; }
    }
    
    .title-dots::after {
      content: '.';
      animation: titleDots 1.8s infinite steps(1);
    }
    
    @keyframes fadeInOut {
      0% { opacity: 0.5; }
      50% { opacity: 1; }
      100% { opacity: 0.5; }
    }
    
    .fade-in-out {
      animation: fadeInOut 4s infinite ease-in-out;
    }
    
    @keyframes textColorCycle {
      0% { color: var(--accent-1); opacity: 1; }
      33% { color: var(--foreground-muted); opacity: 0.8; }
      66% { color: var(--foreground-muted); opacity: 0.4; }
      100% { color: var(--accent-1); opacity: 1; }
    }
    
    @keyframes rotateY {
      0% { transform: translateZ(20px) rotateY(0deg); }
      100% { transform: translateZ(20px) rotateY(360deg); }
    }
    
    @keyframes floatText {
      0% { transform: translateZ(60px); }
      50% { transform: translateZ(100px); }
      100% { transform: translateZ(60px); }
    }
    
    .rotate-y-3d {
      animation: rotateY 3s linear infinite;
      transform-style: preserve-3d;
      backface-visibility: visible;
    }
    
    .float-text-3d {
      animation: floatText 3s ease-in-out infinite;
      transform-style: preserve-3d;
    }
    
    .image-container-3d {
      perspective: 1200px;
      transform-style: preserve-3d;
      perspective-origin: center center;
    }
    
    .text-color-cycle {
      animation: textColorCycle 2s infinite;
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
      <div className="flex flex-1 flex-col pb-4 last:pb-0">
        <div
          className={cn(
            'text-sm font-medium',
            status === 'completed'
              ? 'text-accent-1'
              : status === 'current'
                ? 'text-foreground-strong'
                : 'text-foreground-muted',
            isProcessing && 'text-color-cycle',
          )}
        >
          {title}
          {isProcessing && <span className="processing-dots ml-1" data-dot={dotCount}></span>}
        </div>
        {description && (
          <div
            className={cn('mt-1 text-sm text-foreground-muted', isProcessing && 'text-color-cycle')}
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

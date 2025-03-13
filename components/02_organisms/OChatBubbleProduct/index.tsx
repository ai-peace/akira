import ETypewriterText from '@/components/01_elements/ETypewriterText'
import OProductListItem from '@/components/02_organisms/OProductListItem'
import { OProductListModal } from '@/components/02_organisms/OProductListModal'
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble'
import { ProductEntity } from '@/domains/entities/product.entity'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FC, useEffect, useRef, useState } from 'react'

type Props = {
  products: ProductEntity[]
  message: string
}

const Component: FC<Props> = ({ products, message }) => {
  const [showModal, setShowModal] = useState(false)
  const [displayCount] = useState(8)
  const [isMobile, setIsMobile] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  // 画面サイズの変更を検知
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768) // 768px未満をモバイルとみなす
    }

    // 初期チェック
    checkIfMobile()

    // リサイズイベントのリスナーを追加
    window.addEventListener('resize', checkIfMobile)

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  // スクロール位置に応じて矢印の表示/非表示を切り替え
  const handleScroll = () => {
    if (!carouselRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10) // 少し余裕を持たせる
  }

  useEffect(() => {
    const carousel = carouselRef.current
    if (carousel) {
      carousel.addEventListener('scroll', handleScroll)
      return () => carousel.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  const handleShowMore = () => {
    setShowModal(true)
  }

  return (
    <>
      <ChatBubble variant="received">
        <ChatBubbleAvatar fallback="AI" src="/images/picture/picture_akira-kun.png" />
        <ChatBubbleMessage variant="received">
          <ETypewriterText text={message} delay={200} />
        </ChatBubbleMessage>
      </ChatBubble>

      {isMobile ? (
        <div className="relative w-full">
          {showLeftArrow && (
            <button
              onClick={scrollLeft}
              className="absolute -left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background shadow-md"
              aria-label="前へ"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="-ml-4 -mr-4 w-[100vw] overflow-hidden md:w-full">
            <div
              ref={carouselRef}
              className="no-scrollbar flex w-full snap-x snap-mandatory gap-2 overflow-x-auto pb-2 pt-1"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                transition: 'transform 0.3s ease-in-out',
              }}
            >
              <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div
                key="start-spacer"
                className="w-2 min-w-2 flex-shrink-0 snap-start"
                aria-hidden="true"
              />
              {products.slice(0, displayCount).map((product, index) => (
                <div
                  key={product.itemCode}
                  className="w-[140px] min-w-[140px] max-w-[140px] flex-shrink-0 snap-start"
                  style={{ aspectRatio: '4/3' }}
                >
                  <OProductListItem product={product} />
                </div>
              ))}
              <div
                key="end-spacer"
                className="w-2 min-w-2 flex-shrink-0 snap-start"
                aria-hidden="true"
              />
            </div>
          </div>
          {showRightArrow && (
            <button
              onClick={scrollRight}
              className="z-2 absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-foreground shadow-md"
              aria-label="次へ"
            >
              <ChevronRight className="h-5 w-5 text-background" />
            </button>
          )}

          {/* {products.length > displayCount && (
            <div className="mt-2 flex justify-end">
              <button onClick={handleShowMore} className="text-xs text-blue-500 hover:underline">
                全て見る ({products.length})
              </button>
            </div>
          )} */}
        </div>
      ) : (
        <div className="grid w-full grid-cols-4 gap-2">
          {products.slice(0, displayCount).map((product) => (
            <OProductListItem key={product.itemCode} product={product} />
          ))}
        </div>
      )}

      {!isMobile && products.length > displayCount && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleShowMore}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-all hover:bg-blue-600"
          >
            View all ({products.length} items)
          </button>
        </div>
      )}

      <OProductListModal showModal={showModal} setShowModal={setShowModal} products={products} />
    </>
  )
}

export { Component as OChatBubbleProduct }

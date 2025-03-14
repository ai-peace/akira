import { OProductListItem } from '@/components/02_organisms/OProductListItem'
import { ProductEntity } from '@/domains/entities/product.entity'
import { getPromptGroupUrl } from '@/utils/url.helper'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { FC, useEffect, useRef, useState } from 'react'

type Props = {
  products: ProductEntity[]
  displayCount: number
  promptGroupUniqueKey: string
}

const Component: FC<Props> = ({ products, displayCount, promptGroupUniqueKey }) => {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [showRightArrow, setShowRightArrow] = useState(true)

  // スクロール位置に応じて矢印の表示/非表示を切り替え
  const handleScroll = () => {
    if (!carouselRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10) // 少し余裕を持たせる
  }

  useEffect(() => {
    const carousel = carouselRef.current
    if (carousel) {
      carousel.addEventListener('scroll', handleScroll)
      return () => carousel.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  return (
    <>
      <div className="relative -ml-4 -mr-4 h-full w-[100vw] overflow-hidden md:w-full">
        <div
          ref={carouselRef}
          className="no-scrollbar flex h-full w-full snap-x snap-mandatory items-stretch gap-2 overflow-x-auto pb-2 pt-1"
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
          {products.slice(0, displayCount).map((product) => (
            <div
              key={product.itemCode}
              className="relative flex h-full w-[140px] min-w-[140px] max-w-[140px] flex-shrink-0 snap-start"
            >
              <div className="flex-1">
                <OProductListItem product={product} />
              </div>
            </div>
          ))}
          <div
            key="end-spacer"
            className="w-2 min-w-2 flex-shrink-0 snap-start"
            aria-hidden="true"
          />
        </div>
        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="z-2 absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-foreground shadow-md"
            aria-label="次へ"
          >
            <ChevronRight className="h-5 w-5 text-background" />
          </button>
        )}
      </div>

      {promptGroupUniqueKey && (
        <div className="flex justify-end">
          <Link
            href={getPromptGroupUrl(promptGroupUniqueKey)}
            className="rounded-md px-4 py-2 text-sm text-blue-500 transition-all hover:underline"
          >
            View all
          </Link>
        </div>
      )}
    </>
  )
}

export { Component as OProductCarousel }

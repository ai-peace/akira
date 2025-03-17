import { ProductEntity } from '@/domains/entities/product.entity'
import { FC, useEffect, useMemo, useState } from 'react'
import { OProductCarousel } from '../OProductCarousel'
import { OProductListItemCollection } from '../OProductListItem/collection'

type Props = {
  products: ProductEntity[]
  promptGroupUniqueKey: string
}

const Component: FC<Props> = ({ products, promptGroupUniqueKey }) => {
  const [displayCount] = useState(8)
  const [isMobile, setIsMobile] = useState(false)

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

  // 商品をユニークIDでソート
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const uniqueKeyA = a.uniqueKey || ''
      const uniqueKeyB = b.uniqueKey || ''
      return uniqueKeyA.localeCompare(uniqueKeyB)
    })
  }, [products])

  return (
    <>
      {isMobile ? (
        <OProductCarousel
          products={sortedProducts}
          displayCount={displayCount}
          promptGroupUniqueKey={promptGroupUniqueKey}
        />
      ) : (
        <OProductListItemCollection
          products={sortedProducts}
          displayCount={displayCount}
          promptGroupUniqueKey={promptGroupUniqueKey}
        />
      )}
    </>
  )
}

export { Component as OChatProducts }

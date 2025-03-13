import { FC, useEffect, useState } from 'react'
import { OProductCarousel } from '../OProductCarousel'
import { OProductListItemCollection } from '../OProductListItem/collection'
import { ProductEntity } from '@/domains/entities/product.entity'
import { OProductListModal } from '../OProductListModal'

type Props = {
  products: ProductEntity[]
}

const Component: FC<Props> = ({ products }) => {
  const [showModal, setShowModal] = useState(false)
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

  const handleShowMore = () => {
    setShowModal(true)
  }

  return (
    <>
      {isMobile ? (
        <OProductCarousel
          products={products}
          displayCount={displayCount}
          onShowMore={handleShowMore}
        />
      ) : (
        <OProductListItemCollection
          products={products}
          displayCount={displayCount}
          onShowMore={handleShowMore}
        />
      )}

      <OProductListModal showModal={showModal} setShowModal={setShowModal} products={products} />
    </>
  )
}

export { Component as OChatProducts }

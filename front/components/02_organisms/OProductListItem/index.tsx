import { ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS, getStockStatusDisplay } from '@/common/domains/types/stock-status'
import { Card } from '@/front/components/ui/card'
import { useRouter } from 'next/navigation'
import { FC } from 'react'

type Props = {
  product: ProductEntity
  promptGroupUniqueKey?: string
}

const Component: FC<Props> = ({ product, promptGroupUniqueKey }) => {
  const router = useRouter()

  const handleProductClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // 商品のuniqueKeyとpromptGroupUniqueKeyをURLパラメータとして渡す
    router.push(`/products/${product.uniqueKey}?pgKey=${promptGroupUniqueKey || ''}`)
  }

  // 在庫切れの場合の透明度を設定
  const isOutOfStock = product.status === STOCK_STATUS.OUT_OF_STOCK
  const opacityClass = isOutOfStock ? 'opacity-20' : ''

  return (
    <>
      <Card
        key={`${product.itemCode}-${product.title.en}`}
        className={`overflow-hidden shadow-none transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${opacityClass}`}
      >
        <div
          className="flex h-full cursor-pointer flex-col justify-between"
          onClick={handleProductClick}
        >
          <div>
            <div className="relative flex h-[200px] w-full items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.title.en}
                width={100}
                height={300}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col p-2">
              <div className="group relative text-xs">
                <span>{product.title.en}</span>
                <span className="invisible absolute -top-8 left-0 whitespace-nowrap rounded bg-gray-800 p-2 text-xs text-white group-hover:visible">
                  {product.title.ja}
                </span>
              </div>
            </div>
          </div>
          {/* 価格・店舗情報 */}
          <div className="flex flex-col p-2">
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm font-bold text-red-500">
                ${Math.round(product.price / 150).toLocaleString()}
              </div>
              <div
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  product.status === STOCK_STATUS.AVAILABLE
                    ? 'bg-green-100 text-green-700'
                    : product.status === STOCK_STATUS.OUT_OF_STOCK
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {getStockStatusDisplay(product.status, 'en')}
              </div>
            </div>
          </div>
          {/* <div className="flex flex-col p-2">
            <div className="text-xs">{product.shopName}</div>
          </div> */}
        </div>
      </Card>
    </>
  )
}

export { Component as OProductListItem }

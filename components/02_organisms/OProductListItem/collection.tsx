import { ProductEntity } from '@/domains/entities/product.entity'
import { FC } from 'react'
import { OProductListItem } from './index'

type Props = {
  products: ProductEntity[]
  displayCount: number
  onShowMore: () => void
}

const Component: FC<Props> = ({ products, displayCount, onShowMore }) => {
  return (
    <>
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.slice(0, displayCount).map((product) => (
          <OProductListItem key={product.itemCode} product={product} />
        ))}
      </div>
      {products.length > displayCount && (
        <div className="flex justify-center">
          <button
            onClick={onShowMore}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-all hover:bg-blue-600"
          >
            View all ({products.length} items)
          </button>
        </div>
      )}
    </>
  )
}

export { Component as OProductListItemCollection }

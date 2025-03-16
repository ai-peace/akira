import { ProductEntity } from '@/domains/entities/product.entity'
import { FC } from 'react'
import { OProductListItem } from './index'
import { getPromptGroupUrl } from '@/utils/url.helper'
import Link from 'next/link'

type Props = {
  products: ProductEntity[]
  displayCount: number
  promptGroupUniqueKey?: string
}

const Component: FC<Props> = ({ products, displayCount, promptGroupUniqueKey }) => {
  return (
    <>
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {products.slice(0, displayCount).map((product) => (
          <OProductListItem
            key={product.uniqueKey || product.itemCode}
            product={product}
            promptGroupUniqueKey={promptGroupUniqueKey}
          />
        ))}
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

export { Component as OProductListItemCollection }

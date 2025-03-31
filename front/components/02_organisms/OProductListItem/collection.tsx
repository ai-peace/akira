import { ProductEntity } from '@/common/domains/entities/product.entity'
import { FC } from 'react'
import { OProductListItem } from './index'
import { getPromptGroupUrl } from '@/front/util/url.helper'
import Link from 'next/link'
import { Button } from '@/front/components/ui/button'
import { ArrowRight } from 'lucide-react'

type Props = {
  products: ProductEntity[]
  displayCount: number
  promptGroupUniqueKey?: string
  showViewAll?: boolean
}

const Component: FC<Props> = ({
  products,
  displayCount,
  promptGroupUniqueKey,
  showViewAll = true,
}) => {
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
      {promptGroupUniqueKey && showViewAll && (
        <div className="flex justify-end pt-4">
          <Link href={getPromptGroupUrl(promptGroupUniqueKey)}>
            <Button variant="outline" size="sm" className="gap-2">
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </>
  )
}

export { Component as OProductListItemCollection }

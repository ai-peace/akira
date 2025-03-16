import { ProductEntity } from '@/domains/entities/product.entity'
import { FC, useMemo, useState } from 'react'
import { OProductListItemCollection } from '../../02_organisms/OProductListItem/collection'
import { ArrowLeftIcon, ListFilter } from 'lucide-react'
import Link from 'next/link'

type Props = {
  products: ProductEntity[]
  chatUniqueKey: string
  promptGroupUniqueKey?: string
}

const Component: FC<Props> = ({ products, chatUniqueKey, promptGroupUniqueKey }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [activeTab, setActiveTab] = useState<string>('all')

  const shops = useMemo(() => {
    const shopSet = new Set<string>()
    products.forEach((product) => {
      shopSet.add(product.shopName || 'unknown')
    })
    return ['all', ...Array.from(shopSet)]
  }, [products])

  const shopCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length }
    products.forEach((product) => {
      const shop = product.shopName || 'unknown'
      counts[shop] = (counts[shop] || 0) + 1
    })
    return counts
  }, [products])

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Filter by search term
        const matchesSearch =
          searchTerm === '' ||
          product.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.title.ja.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())

        // Filter by shop
        const matchesShop =
          activeTab === 'all' ||
          product.shopName === activeTab ||
          (activeTab === 'unknown' && !product.shopName)

        return matchesSearch && matchesShop
      })
      .sort((a, b) => {
        // Sort by price
        const priceA = a.price || 0
        const priceB = b.price || 0
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA
      })
  }, [products, searchTerm, sortOrder, activeTab])

  return (
    <>
      <div className="relative bg-background">
        {/* Search filter */}
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-2 pb-2 md:px-4 md:pb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-foreground md:px-3 md:py-2"
            />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-foreground hover:bg-secondary"
          >
            <ListFilter className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar - scrollable container */}
        <div className="relative w-full max-w-[100vw] border-b border-border md:mx-auto md:max-w-3xl">
          <div
            className="-mb-[1px] overflow-x-auto overflow-y-hidden"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x proximity',
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="flex whitespace-nowrap px-4">
              {shops.map((shop) => {
                // Get current shop icon URL
                const shopIconUrl =
                  shop === 'all' || shop === 'unknown'
                    ? null
                    : products.find((product) => product.shopName === shop)?.shopIconUrl

                return (
                  <button
                    key={shop}
                    onClick={() => setActiveTab(shop)}
                    className={`flex-shrink-0 border-b-2 px-4 py-2 text-sm transition-all duration-200 ${
                      activeTab === shop
                        ? 'border-accent-2 text-accent-2'
                        : 'border-transparent text-foreground-muted hover:border-border-strong hover:text-foreground'
                    }`}
                    style={{
                      marginBottom: '-1px',
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <div className="flex items-center">
                        {shopIconUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={shopIconUrl}
                            alt={shop}
                            className="mr-1.5 h-4 w-4 rounded-full object-contain"
                            onError={(e) => {
                              // Hide on image load error
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <span>{shop === 'unknown' ? 'Other' : shop === 'all' ? 'All' : shop}</span>
                      </div>
                      <span
                        className={`text-xs ${activeTab === shop ? 'text-accent-2' : 'text-foreground-subtle'}`}
                      >
                        ({shopCounts[shop]})
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl p-2 md:p-4">
        <OProductListItemCollection
          products={filteredProducts}
          displayCount={filteredProducts.length}
          promptGroupUniqueKey={promptGroupUniqueKey}
        />
      </div>
    </>
  )
}

export { Component as TProductSearch }

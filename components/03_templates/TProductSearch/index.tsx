import { ProductEntity } from '@/domains/entities/product.entity'
import { FC, useMemo, useState } from 'react'
import { OProductListItemCollection } from '../../02_organisms/OProductListItem/collection'
import { ArrowLeftIcon, ListFilter } from 'lucide-react'
import Link from 'next/link'

type Props = {
  products: ProductEntity[]
  chatUniqueKey?: string
}

const Component: FC<Props> = ({ products, chatUniqueKey }) => {
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
        // フィルタリング: 検索語句
        const matchesSearch =
          searchTerm === '' ||
          product.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.title.ja.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())

        // フィルタリング: ショップ
        const matchesShop =
          activeTab === 'all' ||
          product.shopName === activeTab ||
          (activeTab === 'unknown' && !product.shopName)

        return matchesSearch && matchesShop
      })
      .sort((a, b) => {
        // 並び替え: 価格
        const priceA = a.price || 0
        const priceB = b.price || 0
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA
      })
  }, [products, searchTerm, sortOrder, activeTab])

  return (
    <div className="">
      <div className="relative bg-background md:rounded-xl">
        {chatUniqueKey ? (
          <Link
            href={`/chats/${chatUniqueKey}`}
            className="relative flex items-center justify-between p-2 md:p-4"
          >
            <button className="flex items-center gap-2 rounded-full p-2 hover:bg-gray-100">
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <h2 className="text-md absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold">
              All products
            </h2>
            <div id="spacer" />
          </Link>
        ) : (
          <div className="relative flex items-center justify-between p-2 md:p-4">
            <div className="h-6" />
            <h2 className="text-md absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold">
              All products
            </h2>
            <div id="spacer" />
          </div>
        )}

        {/* Search filter */}
        <div className="flex items-center gap-2 px-2 pb-2 md:px-4 md:pb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border px-2 py-1 md:px-3 md:py-2"
            />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50"
          >
            <ListFilter className="h-4 w-4" />
          </button>
        </div>

        {/* タブバー - スクロール可能なコンテナ */}
        <div className="relative w-full max-w-[100vw] border-b">
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
              {[...shops, ...shops].map((shop) => {
                // 現在の店舗のアイコンURLを取得
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
                        ? 'border-blue-500 text-blue-500'
                        : 'hover:text-foreground-hover border-transparent text-foreground-muted hover:border-gray-300'
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
                              // 画像読み込みエラー時に代替表示
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <span>{shop === 'unknown' ? 'Other' : shop === 'all' ? 'All' : shop}</span>
                      </div>
                      <span
                        className={`text-xs ${activeTab === shop ? 'text-blue-400' : 'text-gray-400'}`}
                      >
                        ({shopCounts[shop]})
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* スクロールインジケーター（オプション） */}
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-8 bg-gradient-to-l from-background-muted to-transparent"></div>
        </div>
      </div>

      <div className="p-2 md:p-4">
        <OProductListItemCollection
          products={filteredProducts}
          displayCount={filteredProducts.length}
          onShowMore={() => {}}
        />
      </div>
    </div>
  )
}

export { Component as TProductSearch }

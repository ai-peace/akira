import { ProductEntity } from '@/domains/entities/product.entity'
import { FC, useMemo, useState } from 'react'
import { OProductListItemCollection } from '../../02_organisms/OProductListItem/collection'
import {
  ArrowLeftIcon,
  ListFilter,
  SortAsc,
  SortDesc,
  Shuffle,
  Hash,
  AlignJustify,
} from 'lucide-react'
import Link from 'next/link'

type Props = {
  products: ProductEntity[]
  chatUniqueKey: string
  promptGroupUniqueKey?: string
}

// ソートタイプの定義
type SortType = 'price' | 'itemCode' | 'random' | 'uniqueKey'

const Component: FC<Props> = ({ products, chatUniqueKey, promptGroupUniqueKey }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortType, setSortType] = useState<SortType>('price')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
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
    let filtered = products.filter((product) => {
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

    // ソートタイプに応じてソート
    if (sortType === 'random') {
      // ランダムソート
      return [...filtered].sort(() => Math.random() - 0.5)
    } else {
      // 価格、itemCode、またはuniqueKeyでソート
      return filtered.sort((a, b) => {
        if (sortType === 'price') {
          // 価格順
          const priceA = a.price || 0
          const priceB = b.price || 0
          return sortOrder === 'asc' ? priceA - priceB : priceB - priceA
        } else if (sortType === 'itemCode') {
          // itemCode順
          const itemCodeA = a.itemCode || ''
          const itemCodeB = b.itemCode || ''
          return sortOrder === 'asc'
            ? itemCodeA.localeCompare(itemCodeB)
            : itemCodeB.localeCompare(itemCodeA)
        } else {
          // uniqueKey順（アルファベット順）
          const uniqueKeyA = a.uniqueKey || ''
          const uniqueKeyB = b.uniqueKey || ''
          return sortOrder === 'asc'
            ? uniqueKeyA.localeCompare(uniqueKeyB)
            : uniqueKeyB.localeCompare(uniqueKeyA)
        }
      })
    }
  }, [products, searchTerm, sortType, sortOrder, activeTab])

  // ソートタイプを切り替える関数
  const toggleSortType = () => {
    if (sortType === 'price') {
      setSortType('itemCode')
    } else if (sortType === 'itemCode') {
      setSortType('uniqueKey')
    } else if (sortType === 'uniqueKey') {
      setSortType('random')
    } else {
      setSortType('price')
    }
  }

  // ソートアイコンを取得する関数
  const getSortIcon = () => {
    if (sortType === 'price') {
      return sortOrder === 'asc' ? (
        <SortAsc className="h-4 w-4" />
      ) : (
        <SortDesc className="h-4 w-4" />
      )
    } else if (sortType === 'itemCode') {
      return <Hash className="h-4 w-4" />
    } else if (sortType === 'uniqueKey') {
      return <AlignJustify className="h-4 w-4" />
    } else {
      return <Shuffle className="h-4 w-4" />
    }
  }

  // ソートタイプの表示名を取得する関数
  const getSortTypeName = () => {
    switch (sortType) {
      case 'price':
        return '価格順'
      case 'itemCode':
        return '商品コード順'
      case 'uniqueKey':
        return 'ユニークID順'
      case 'random':
        return 'ランダム'
      default:
        return 'ソート'
    }
  }

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
            onClick={toggleSortType}
            className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-foreground hover:bg-secondary"
            title={`ソート: ${getSortTypeName()}`}
          >
            {getSortIcon()}
          </button>
          {sortType !== 'random' && (
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-foreground hover:bg-secondary"
              title={`順序: ${sortOrder === 'asc' ? '昇順' : '降順'}`}
            >
              <ListFilter className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tab bar - scrollable container */}
        {/* <div className="relative w-full max-w-[100vw] border-b border-border md:mx-auto md:max-w-3xl">
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
        </div> */}
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

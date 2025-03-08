import { FC, useMemo, useState } from 'react'
import OProductListItem from '../OProductListItem'
import { ProductEntity } from '@/domains/entities/product.entity'

type Props = {
  showModal: boolean
  setShowModal: (show: boolean) => void
  products: ProductEntity[]
}

const Component: FC<Props> = ({ showModal, setShowModal, products }) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // 検索フィルター適用
  const searchFilteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!searchTerm) return true
      return (
        product.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.title.ja.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [products, searchTerm])

  // 商品一覧から店舗を動的に抽出
  const shops = useMemo(() => {
    const shopSet = new Set(searchFilteredProducts.map((p) => p.shopName || 'unknown'))
    return ['all', ...Array.from(shopSet)].filter(Boolean)
  }, [searchFilteredProducts])

  // 店舗ごとの商品数を計算
  const shopCounts = useMemo(() => {
    return shops.reduce(
      (acc, shop) => {
        if (shop === 'all') {
          acc[shop] = searchFilteredProducts.length
        } else {
          acc[shop] = searchFilteredProducts.filter(
            (p) => (p.shopName || 'unknown') === shop,
          ).length
        }
        return acc
      },
      {} as Record<string, number>,
    )
  }, [searchFilteredProducts, shops])

  // タブフィルターとソートを適用
  const filteredProducts = useMemo(() => {
    return searchFilteredProducts
      .filter((product) => {
        if (activeTab === 'all') return true
        return (product.shopName || 'unknown') === activeTab
      })
      .sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.price - b.price
        }
        return b.price - a.price
      })
  }, [searchFilteredProducts, activeTab, sortOrder])

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="max-h-[90vh] w-[90vw] overflow-hidden rounded-lg bg-background">
        <div className="sticky top-0 z-10 border-b bg-background">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-bold">All products ({filteredProducts.length} items)</h2>
            <button
              onClick={() => setShowModal(false)}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-4 px-4 pb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50"
            >
              Price {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {shops.map((shop) => (
              <button
                key={shop}
                onClick={() => setActiveTab(shop)}
                className={`rounded-md px-3 py-1 ${
                  activeTab === shop ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {shop === 'unknown' ? 'Other' : shop} ({shopCounts[shop]})
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[calc(90vh-200px)] overflow-y-auto p-6">
          <div className="grid grid-cols-6 gap-4">
            {filteredProducts.map((product) => (
              <OProductListItem key={product.itemCode} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export { Component as OProductListModal }

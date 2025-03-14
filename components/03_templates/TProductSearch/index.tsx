import { ProductEntity } from '@/domains/entities/product.entity'
import { FC, useMemo, useState } from 'react'
import { OProductListItemCollection } from '../../02_organisms/OProductListItem/collection'
import { ArrowLeftIcon, ListFilter } from 'lucide-react'

type Props = {
  showModal: boolean
  setShowModal: (show: boolean) => void
  products: ProductEntity[]
}

const Component: FC<Props> = ({ showModal, setShowModal, products }) => {
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

  if (!showModal) return null

  return (
    <div>
      <div className="relative top-0 z-10 border-b bg-background-muted md:rounded-xl">
        <div className="relative flex items-center justify-between p-2 md:p-4">
          <button
            onClick={() => setShowModal(false)}
            className="flex items-center gap-2 rounded-full p-2 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <h2 className="text-md absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold">
            All products ({filteredProducts.length} items)
          </h2>
          <div id="spacer" />
        </div>

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

        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {shops.map((shop) => (
            <button
              key={shop}
              onClick={() => setActiveTab(shop)}
              className={`rounded-md px-3 py-1 ${
                activeTab === shop ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {shop === 'unknown' ? 'Other' : shop === 'all' ? 'All' : shop} ({shopCounts[shop]})
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[calc(100vh-200px)] overflow-y-scroll p-4 md:max-h-[calc(90vh-200px)] md:p-4">
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

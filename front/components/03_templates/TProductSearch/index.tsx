import { ProductEntity } from '@/common/domains/entities/product.entity'
import { FC, useMemo, useState, useEffect } from 'react'
import { OProductListItemCollection } from '../../02_organisms/OProductListItem/collection'
import { Filter, ArrowUpDown, Check } from 'lucide-react'
import Link from 'next/link'
import { STOCK_STATUS, getStockStatusDisplay } from '@/common/domains/types/stock-status'
import { Popover, PopoverContent, PopoverTrigger } from '@/front/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/front/components/ui/tooltip'
import { StockFilterStatusRepository } from '@/front/repositories/stock-filter-status.repository'
import { Tabs, TabsList, TabsTrigger } from '@/front/components/ui/tabs'

type Props = {
  products: ProductEntity[]
  chatUniqueKey: string
  promptGroupUniqueKey?: string
}

const Component: FC<Props> = ({ products, chatUniqueKey, promptGroupUniqueKey }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [activeTagFilter, setActiveTagFilter] = useState<string>('all')
  const [open, setOpen] = useState(false)

  // Initialize with stored statuses
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => {
    return StockFilterStatusRepository.get()
  })

  // Save to storage whenever selectedStatuses changes
  useEffect(() => {
    StockFilterStatusRepository.set(selectedStatuses)
  }, [selectedStatuses])

  const stockStatuses = useMemo(() => {
    return Object.values(STOCK_STATUS)
  }, [])

  const stockCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    products.forEach((product) => {
      const status = product.status || STOCK_STATUS.UNKNOWN
      counts[status] = (counts[status] || 0) + 1
    })
    return counts
  }, [products])

  // 全商品から一意のタグリストを抽出
  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>()
    tagSet.add('all')

    products.forEach((product) => {
      if (product.tags && product.tags.length > 0) {
        product.tags.forEach((tag) => tagSet.add(tag))
      }
    })

    return Array.from(tagSet)
  }, [products])

  // タグごとの商品数をカウント
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length }

    products.forEach((product) => {
      if (product.tags && product.tags.length > 0) {
        product.tags.forEach((tag) => {
          counts[tag] = (counts[tag] || 0) + 1
        })
      }
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

        // Filter by tag
        const matchesTag =
          activeTagFilter === 'all' || (product.tags && product.tags.includes(activeTagFilter))

        // Filter by stock status - show if status is in selectedStatuses
        const matchesStock = selectedStatuses.includes(product.status || STOCK_STATUS.UNKNOWN)

        return matchesSearch && matchesShop && matchesTag && matchesStock
      })
      .sort((a, b) => {
        // Sort by price
        const priceA = a.price || 0
        const priceB = b.price || 0
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA
      })
  }, [products, searchTerm, sortOrder, activeTab, activeTagFilter, selectedStatuses])

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }

  const selectedStatusesLabel = useMemo(() => {
    if (selectedStatuses.length === stockStatuses.length) return 'All Status'
    if (selectedStatuses.length === 0) return 'No Status'
    return `${selectedStatuses.length} Selected`
  }, [selectedStatuses, stockStatuses])

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
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <button className="flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background hover:bg-secondary">
                          <Filter className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2">
                        <div className="space-y-2">
                          {stockStatuses.map((status) => {
                            const statusLabel = getStockStatusDisplay(status)
                            const isSelected = selectedStatuses.includes(status)

                            return (
                              <button
                                key={status}
                                onClick={() => handleStatusToggle(status)}
                                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex h-4 w-4 items-center justify-center rounded border border-input">
                                    {isSelected && <Check className="h-3 w-3 text-accent-2" />}
                                  </div>
                                  <span>{statusLabel}</span>
                                  <span className="text-xs text-foreground-muted">
                                    ({stockCounts[status] || 0})
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter by: {selectedStatusesLabel}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background hover:bg-secondary"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sort by price ({sortOrder === 'asc' ? '安い順' : '高い順'})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* カテゴリタブ */}
      {uniqueTags.length > 1 && (
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-3xl px-2 md:px-4">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex w-full">
                {uniqueTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTagFilter(tag)}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${
                      activeTagFilter === tag
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tag === 'all' ? 'すべて' : tag}
                    <span className="ml-1 text-xs text-gray-500">({tagCounts[tag] || 0})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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

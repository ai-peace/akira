import { ProductEntity } from '@/domains/entities/product.entity'
import { FC, useMemo, useState } from 'react'
import { OProductListItemCollection } from '../../02_organisms/OProductListItem/collection'
import { Filter, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import { STOCK_STATUS, getStockStatusDisplay } from '@/domains/types/stock-status'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Props = {
  products: ProductEntity[]
  chatUniqueKey: string
  promptGroupUniqueKey?: string
}

const Component: FC<Props> = ({ products, chatUniqueKey, promptGroupUniqueKey }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [open, setOpen] = useState(false)

  const shops = useMemo(() => {
    const shopSet = new Set<string>()
    products.forEach((product) => {
      shopSet.add(product.shopName || 'unknown')
    })
    return ['all', ...Array.from(shopSet)]
  }, [products])

  const stockStatuses = useMemo(() => {
    return ['all', ...Object.values(STOCK_STATUS)]
  }, [])

  const stockCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length }
    products.forEach((product) => {
      const status = product.status || STOCK_STATUS.UNKNOWN
      counts[status] = (counts[status] || 0) + 1
    })
    return counts
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

        // Filter by stock status
        const matchesStock =
          stockFilter === 'all' ||
          product.status === stockFilter ||
          (stockFilter === STOCK_STATUS.UNKNOWN && !product.status)

        return matchesSearch && matchesShop && matchesStock
      })
      .sort((a, b) => {
        // Sort by price
        const priceA = a.price || 0
        const priceB = b.price || 0
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA
      })
  }, [products, searchTerm, sortOrder, activeTab, stockFilter])

  const selectedStatusLabel = useMemo(() => {
    if (stockFilter === 'all') return 'All Status'
    return getStockStatusDisplay(stockFilter)
  }, [stockFilter])

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
                        <div className="space-y-1">
                          {stockStatuses.map((status) => {
                            const statusLabel =
                              status === 'all' ? 'All Status' : getStockStatusDisplay(status)

                            return (
                              <button
                                key={status}
                                onClick={() => {
                                  setStockFilter(status)
                                  setOpen(false)
                                }}
                                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex h-4 w-4 items-center justify-center">
                                    <div
                                      className={`h-3 w-3 rounded-full border-2 ${
                                        stockFilter === status
                                          ? 'border-accent-2 bg-accent-2'
                                          : 'border-input'
                                      }`}
                                    />
                                  </div>
                                  <span>{statusLabel}</span>
                                  <span className="text-xs text-foreground-muted">
                                    ({stockCounts[status]})
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
                  <p>Filter by: {selectedStatusLabel}</p>
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

import { StockStatus } from '../types/stock-status'

export type ProductEntity = {
  uniqueKey: string
  title: {
    en: string
    ja: string
  }
  price: number
  priceWithTax?: number
  currency: string
  condition?: string
  description?: string
  imageUrl?: string
  url?: string
  status: StockStatus
  itemCode: string
  shopName: string
  shopIconUrl: string
}

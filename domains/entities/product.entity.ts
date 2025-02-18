export type ProductEntity = {
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
  status: string
  itemCode: string
  shopName: string
  shopIconUrl: string
}

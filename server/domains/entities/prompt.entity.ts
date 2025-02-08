import { ProductEntity } from '@/domains/entities/product.entity'

export type KeywordPair = {
  en: string
  ja: string
}

export type PromptEntity = {
  uniqueKey: string
  llmStatus: 'SUCCESS' | 'PROCESSING' | 'ERROR'
  resultType: 'FIRST_RESPONSE' | 'FOUND_PRODUCT_ITEMS' | 'NO_PRODUCT_ITEMS'
  result?: {
    message?: string
    data?: ProductEntity[]
    keywords?: KeywordPair[]
  }
  createdAt: Date
  updatedAt: Date
}

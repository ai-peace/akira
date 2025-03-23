export type MultiLangValue = {
  en: string
  ja: string
}

export type PriceRange = {
  min?: number
  max?: number
  label: MultiLangValue
}

export type KeywordChild = {
  thumbnailUrl: string
  value: MultiLangValue
}

export type RecommendKeywordEntity = {
  thumbnailUrl: string
  value: MultiLangValue
  children?: KeywordChild[]
  priceRanges?: PriceRange[]
}

export type KeywordPath = {
  parent?: RecommendKeywordEntity
  current: RecommendKeywordEntity | KeywordChild
}

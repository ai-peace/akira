export type MultiLangValue = {
  en: string
  ja: string
}

export type KeywordChild = {
  thumbnailUrl: string
  value: MultiLangValue
}

export type RecommendKeywordEntity = {
  thumbnailUrl: string
  value: MultiLangValue
  children?: KeywordChild[]
}

export type KeywordPath = {
  parent?: RecommendKeywordEntity
  current: RecommendKeywordEntity | KeywordChild
}

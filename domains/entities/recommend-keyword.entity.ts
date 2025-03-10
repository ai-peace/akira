type RecommendKeywordEntity = {
  thumbnailUrl?: string
  value: {
    en: string
    ja: string
  }
  children?: RecommendKeywordEntity[]
}

export type { RecommendKeywordEntity }

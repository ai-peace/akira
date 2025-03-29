import {
  RecommendKeywordEntity,
  KeywordChild,
  PriceRange,
} from '../entities/recommend-keyword.entity'

const commonPriceRanges: PriceRange[] = [
  {
    max: 100,
    label: { en: 'Under $100', ja: '10,000円未満' },
  },
  {
    min: 100,
    max: 500,
    label: { en: '$100 - $500', ja: '10,000円 - 50,000円' },
  },
  {
    min: 500,
    max: 1000,
    label: { en: '$500 - $1,000', ja: '50,000円 - 100,000円' },
  },
  {
    min: 1000,
    max: 3000,
    label: { en: '$1,000 - $3,000', ja: '10万円 - 30万円' },
  },
  {
    min: 3000,
    max: 5000,
    label: { en: '$3,000 - $5,000', ja: '30万円 - 50万円' },
  },
  {
    min: 5000,
    max: 10000,
    label: { en: '$5,000 - $10,000', ja: '50万円 - 100万円' },
  },
  {
    min: 10000,
    max: 100000,
    label: { en: '$10,000 - $100,000', ja: '100万円 - 1,000万円' },
  },
  {
    min: 100000,
    max: 1000000,
    label: { en: '$100,000 - $1,000,000', ja: '1,000万円 - 1億円' },
  },
  {
    min: 1000000,
    label: { en: 'Over $1,000,000', ja: '1億円以上' },
  },
]

const recommendKeywords: RecommendKeywordEntity[] = [
  {
    thumbnailUrl: '/images/keywords/pokemon-01.png',
    value: { en: 'pokemon', ja: 'ポケモン' },
    children: [
      {
        thumbnailUrl: '/images/keywords/pokemon-02.png',
        value: { en: 'card', ja: 'カード' },
      },
      {
        thumbnailUrl: '/images/keywords/pokemon-03.png',
        value: { en: 'figure', ja: 'フィギュア' },
      },
      {
        thumbnailUrl: '/images/keywords/pokemon-04.png',
        value: { en: 'promo card', ja: 'プロモカード' },
      },
      {
        thumbnailUrl: '/images/keywords/pokemon-05.png',
        value: { en: 'center merchandise', ja: 'センターグッズ' },
      },
      {
        thumbnailUrl: '/images/keywords/pokemon-06.png',
        value: { en: 'movie items', ja: '映画グッズ' },
      },
    ],
    priceRanges: commonPriceRanges,
  },
  {
    thumbnailUrl: '/images/keywords/one-piece-01.png',
    value: { en: 'one-piece', ja: 'ワンピース' },
    children: [
      {
        thumbnailUrl: '/images/keywords/one-piece-02.png',
        value: { en: 'p.o.p. figure', ja: 'P.O.P. フィギュア' },
      },
      {
        thumbnailUrl: '/images/keywords/one-piece-03.png',
        value: { en: 'cel', ja: 'セル画' },
      },
      {
        thumbnailUrl: '/images/keywords/one-piece-04.png',
        value: { en: 'card', ja: 'カード' },
      },
      {
        thumbnailUrl: '/images/keywords/one-piece-05.png',
        value: { en: 'ichiban kuji', ja: '一番くじ' },
      },
      {
        thumbnailUrl: '/images/keywords/one-piece-06.png',
        value: { en: 'jump magazine', ja: 'ジャンプ雑誌' },
      },
    ],
    priceRanges: commonPriceRanges,
  },
  {
    thumbnailUrl: '/images/keywords/dragon-ball-01.png',
    value: { en: 'dragon-ball', ja: 'ドラゴンボール' },
    children: [
      {
        thumbnailUrl: '/images/keywords/dragon-ball-02.png',
        value: { en: 'card', ja: 'カード' },
      },
      {
        thumbnailUrl: '/images/keywords/dragon-ball-03.png',
        value: { en: 'figure', ja: 'フィギュア' },
      },
      {
        thumbnailUrl: '/images/keywords/dragon-ball-04.png',
        value: { en: 'cel', ja: 'セル画' },
      },
      {
        thumbnailUrl: '/images/keywords/dragon-ball-05.png',
        value: { en: 'ichiban kuji', ja: '一番くじ' },
      },
      {
        thumbnailUrl: '/images/keywords/dragon-ball-06.png',
        value: { en: 'movie pamphlet', ja: '映画パンフレット' },
      },
    ],
    priceRanges: commonPriceRanges,
  },
  {
    thumbnailUrl: '/images/keywords/yu-gi-oh-01.png',
    value: { en: 'yu-gi-oh', ja: '遊戯王' },
    children: [
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-02.png',
        value: { en: 'card', ja: 'カード' },
      },
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-03.png',
        value: { en: 'promo card', ja: 'プロモカード' },
      },
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-04.png',
        value: { en: 'tournament pack', ja: 'トーナメントパック' },
      },
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-05.png',
        value: { en: 'merchandise', ja: 'グッズ' },
      },
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-06.png',
        value: { en: 'art book', ja: 'アートブック' },
      },
    ],
    priceRanges: commonPriceRanges,
  },
  {
    thumbnailUrl: '/images/keywords/bearbrick-01.png',
    value: { en: 'bearbrick', ja: 'ベアブリック' },
    children: [
      {
        thumbnailUrl: '/images/keywords/bearbrick-02.png',
        value: { en: 'collaborations', ja: 'コラボレーション' },
      },
      {
        thumbnailUrl: '/images/keywords/bearbrick-03.png',
        value: { en: '1000%', ja: '1000%' },
      },
      {
        thumbnailUrl: '/images/keywords/bearbrick-04.png',
        value: { en: 'artist series', ja: 'アーティストシリーズ' },
      },
      {
        thumbnailUrl: '/images/keywords/bearbrick-05.png',
        value: { en: 'event limited', ja: 'イベント限定' },
      },
      {
        thumbnailUrl: '/images/keywords/bearbrick-06.png',
        value: { en: 'special editions', ja: '特別版' },
      },
    ],
    priceRanges: commonPriceRanges,
  },
]

// 検索用の完全なキーワードを生成する関数
export const getFullKeyword = (
  parentKeyword: RecommendKeywordEntity,
  childKeyword: KeywordChild,
  lang: 'en' | 'ja' = 'en',
): string => {
  return `${parentKeyword.value[lang]} ${childKeyword.value[lang]}`.trim()
}

export { recommendKeywords }

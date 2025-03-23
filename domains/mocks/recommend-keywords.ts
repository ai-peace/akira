import { RecommendKeywordEntity, KeywordChild } from '../entities/recommend-keyword.entity'

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
        thumbnailUrl: '/images/keywords/pokemon-02.png',
        value: { en: 'figure', ja: 'フィギュア' },
      },
      {
        thumbnailUrl: '/images/keywords/pokemon-03.png',
        value: { en: 'promo card', ja: 'プロモカード' },
      },
      {
        thumbnailUrl: '/images/keywords/pokemon-04.png',
        value: { en: 'center merchandise', ja: 'センターグッズ' },
      },
      {
        thumbnailUrl: '/images/keywords/pokemon-05.png',
        value: { en: 'movie items', ja: '映画グッズ' },
      },
    ],
  },
  {
    thumbnailUrl: '/images/keywords/one-piece-01.png',
    value: { en: 'one-piece', ja: 'ワンピース' },
    children: [
      {
        thumbnailUrl: '/images/keywords/one-piece-01.png',
        value: { en: 'p.o.p. figure', ja: 'P.O.P. フィギュア' },
      },
      {
        thumbnailUrl: '/images/keywords/one-piece-02.png',
        value: { en: 'cel', ja: 'セル画' },
      },
      {
        thumbnailUrl: '/images/keywords/one-piece-03.png',
        value: { en: 'card', ja: 'カード' },
      },
      {
        thumbnailUrl: '/images/keywords/one-piece-04.png',
        value: { en: 'ichiban kuji', ja: '一番くじ' },
      },
      {
        thumbnailUrl: '/images/keywords/one-piece-05.png',
        value: { en: 'jump magazine', ja: 'ジャンプ雑誌' },
      },
    ],
  },
  {
    thumbnailUrl: '/images/keywords/dragon-ball-01.png',
    value: { en: 'dragon-ball', ja: 'ドラゴンボール' },
    children: [
      {
        thumbnailUrl: '/images/keywords/dragon-ball-01.png',
        value: { en: 'card', ja: 'カード' },
      },
      {
        thumbnailUrl: '/images/keywords/dragon-ball-02.png',
        value: { en: 'figure', ja: 'フィギュア' },
      },
      {
        thumbnailUrl: '/images/keywords/dragon-ball-03.png',
        value: { en: 'cel', ja: 'セル画' },
      },
      {
        thumbnailUrl: '/images/keywords/dragon-ball-04.png',
        value: { en: 'ichiban kuji', ja: '一番くじ' },
      },
      {
        thumbnailUrl: '/images/keywords/dragon-ball-05.png',
        value: { en: 'movie pamphlet', ja: '映画パンフレット' },
      },
    ],
  },
  {
    thumbnailUrl: '/images/keywords/yu-gi-oh-01.png',
    value: { en: 'yu-gi-oh', ja: '遊戯王' },
    children: [
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-01.png',
        value: { en: 'card', ja: 'カード' },
      },
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-02.png',
        value: { en: 'promo card', ja: 'プロモカード' },
      },
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-03.png',
        value: { en: 'tournament pack', ja: 'トーナメントパック' },
      },
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-04.png',
        value: { en: 'merchandise', ja: 'グッズ' },
      },
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-05.png',
        value: { en: 'art book', ja: 'アートブック' },
      },
    ],
  },
  {
    thumbnailUrl: '/images/keywords/bearbrick-01.png',
    value: { en: 'bearbrick', ja: 'ベアブリック' },
    children: [
      {
        thumbnailUrl: '/images/keywords/bearbrick-01.png',
        value: { en: 'collaborations', ja: 'コラボレーション' },
      },
      {
        thumbnailUrl: '/images/keywords/bearbrick-02.png',
        value: { en: '1000%', ja: '1000%' },
      },
      {
        thumbnailUrl: '/images/keywords/bearbrick-03.png',
        value: { en: 'artist series', ja: 'アーティストシリーズ' },
      },
      {
        thumbnailUrl: '/images/keywords/bearbrick-04.png',
        value: { en: 'event limited', ja: 'イベント限定' },
      },
      {
        thumbnailUrl: '/images/keywords/bearbrick-05.png',
        value: { en: 'special editions', ja: '特別版' },
      },
    ],
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

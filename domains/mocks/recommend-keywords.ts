import { RecommendKeywordEntity } from '../entities/recommend-keyword.entity'

const recommendKeywords: RecommendKeywordEntity[] = [
  {
    thumbnailUrl: '/images/keywords/apple.jpg',
    value: { en: 'pokemon', ja: 'ポケモン' },
    children: [
      {
        thumbnailUrl: '/images/keywords/apple.jpg',
        value: { en: 'pokemon card', ja: 'ポケモンカード' },
      },
      {
        thumbnailUrl: '/images/keywords/apple.jpg',
        value: { en: 'pokemon game', ja: 'ポケモンゲーム' },
      },
      {
        thumbnailUrl: '/images/keywords/apple.jpg',
        value: { en: 'pokemon figure', ja: 'ポケモンフィギュア' },
      },
      {
        thumbnailUrl: '/images/keywords/apple.jpg',
        value: { en: 'pokemon card rare', ja: 'ポケモンカードレア' },
      },
    ],
  },
  {
    thumbnailUrl: '/images/keywords/pineapple.jpg',
    value: { en: 'one-piece', ja: 'ワンピース' },
    children: [
      {
        thumbnailUrl: '/images/keywords/pineapple.jpg',
        value: { en: 'one-piece figure', ja: 'ワンピースフィギュア' },
      },
      {
        thumbnailUrl: '/images/keywords/pineapple.jpg',
        value: { en: 'one-piece manga', ja: 'ワンピース漫画' },
      },
      {
        thumbnailUrl: '/images/keywords/pineapple.jpg',
        value: { en: 'one-piece card', ja: 'ワンピースカード' },
      },
    ],
  },
  {
    thumbnailUrl: '/images/keywords/banana.jpg',
    value: { en: 'dragon-ball', ja: 'ドラゴンボール' },
    children: [
      {
        thumbnailUrl: '/images/keywords/banana.jpg',
        value: { en: 'dragon-ball figure', ja: 'ドラゴンボールフィギュア' },
      },
      {
        thumbnailUrl: '/images/keywords/banana.jpg',
        value: { en: 'dragon-ball manga', ja: 'ドラゴンボール漫画' },
      },
      {
        thumbnailUrl: '/images/keywords/banana.jpg',
        value: { en: 'dragon-ball card', ja: 'ドラゴンボールカード' },
      },
    ],
  },
  {
    thumbnailUrl: '/images/keywords/banana.jpg',
    value: { en: 'yu-gi-oh', ja: '遊戯王' },
    children: [
      {
        thumbnailUrl: '/images/keywords/banana.jpg',
        value: { en: 'yu-gi-oh card', ja: '遊戯王カード' },
      },
      {
        thumbnailUrl: '/images/keywords/banana.jpg',
        value: { en: 'yu-gi-oh rare', ja: '遊戯王レア' },
      },
      {
        thumbnailUrl: '/images/keywords/banana.jpg',
        value: { en: 'yu-gi-oh deck', ja: '遊戯王デッキ' },
      },
    ],
  },
]

export { recommendKeywords }

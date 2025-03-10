import { RecommendKeywordEntity } from '../entities/recommend-keyword.entity'

const recommendKeywords: RecommendKeywordEntity[] = [
  {
    thumbnailUrl: '/images/keywords/apple.jpg',
    value: { en: 'pokemon', ja: 'ポケモン' },
  },
  {
    thumbnailUrl: '/images/keywords/pineapple.jpg',
    value: { en: 'one-piece', ja: 'ワンピース' },
  },
  {
    thumbnailUrl: '/images/keywords/banana.jpg',
    value: { en: 'dragon-ball', ja: 'ドラゴンボール' },
  },
  {
    thumbnailUrl: '/images/keywords/banana.jpg',
    value: { en: 'yu-gi-oh', ja: '遊戯王' },
  },
]

export { recommendKeywords }

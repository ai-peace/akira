import { RecommendKeywordEntity } from '../entities/recommend-keyword.entity'

const recommendKeywords: RecommendKeywordEntity[] = [
  {
    thumbnailUrl: '/images/keywords/pokemon-01.png',
    value: { en: 'pokemon', ja: 'ポケモン' },
    children: [
      {
        thumbnailUrl: '/images/keywords/pokemon-01.png',
        value: { en: 'pokemon card', ja: 'ポケモンカード' },
      },
      {
        thumbnailUrl: '/images/keywords/pokemon-02.png',
        value: { en: 'pokemon figure', ja: 'ポケモンフィギュア' },
      },
      {
        thumbnailUrl: '/images/keywords/pokemon-03.png',
        value: { en: 'pokemon promo card', ja: 'ポケモンプロモカード' },
      },
      {
        thumbnailUrl: '/images/keywords/pokemon-04.png',
        value: { en: 'pokemon center merchandise', ja: 'ポケモンセンターグッズ' },
      },
      {
        thumbnailUrl: '/images/keywords/pokemon-05.png',
        value: { en: 'pokemon movie promo items', ja: 'ポケモン映画プロモアイテム' },
      },
    ],
  },
  {
    thumbnailUrl: '/images/keywords/one-piece-01.png',
    value: { en: 'one-piece', ja: 'ワンピース' },
    children: [
      {
        thumbnailUrl: '/images/keywords/one-piece-01.png',
        value: { en: 'one piece p.o.p. figure', ja: 'ワンピース P.O.P. フィギュア' },
      },
      {
        thumbnailUrl: '/images/keywords/one-piece-02.png',
        value: { en: 'one piece cel', ja: 'ワンピース セル画' },
      },
      {
        thumbnailUrl: '/images/keywords/one-piece-03.png',
        value: { en: 'one piece card game', ja: 'ワンピースカードゲーム' },
      },
      {
        thumbnailUrl: '/images/keywords/one-piece-04.png',
        value: { en: 'one piece ichiban kuji', ja: 'ワンピース 一番くじ' },
      },
      {
        thumbnailUrl: '/images/keywords/one-piece-05.png',
        value: { en: 'one piece jump magazine', ja: 'ワンピース ジャンプ雑誌' },
      },
    ],
  },
  {
    thumbnailUrl: '/images/keywords/dragon-ball-01.png',
    value: { en: 'dragon-ball', ja: 'ドラゴンボール' },
    children: [
      {
        thumbnailUrl: '/images/keywords/dragon-ball-01.png',
        value: { en: 'dragon ball card', ja: 'ドラゴンボール カード' },
      },
      {
        thumbnailUrl: '/images/keywords/dragon-ball-02.png',
        value: { en: 'dragon ball figure', ja: 'ドラゴンボール フィギュア' },
      },
      {
        thumbnailUrl: '/images/keywords/dragon-ball-03.png',
        value: { en: 'dragon ball cel image', ja: 'ドラゴンボール セル画' },
      },
      {
        thumbnailUrl: '/images/keywords/dragon-ball-04.png',
        value: { en: 'dragon ball ichiban kuji', ja: 'ドラゴンボール 一番くじ' },
      },
      {
        thumbnailUrl: '/images/keywords/dragon-ball-05.png',
        value: { en: 'dragon ball movie pamphlet', ja: 'ドラゴンボール 映画パンフレット' },
      },
    ],
  },
  {
    thumbnailUrl: '/images/keywords/yu-gi-oh-01.png',
    value: { en: 'yu-gi-oh', ja: '遊戯王' },
    children: [
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-01.png',
        value: { en: 'yu-gi-oh card', ja: '遊戯王カード' },
      },
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-02.png',
        value: { en: 'yu-gi-oh promo card', ja: '遊戯王プロモカード' },
      },
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-03.png',
        value: { en: 'yu-gi-oh tournament pack', ja: '遊戯王トーナメントパック' },
      },
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-04.png',
        value: { en: 'yu-gi-oh official merchandise', ja: '遊戯王公式グッズ' },
      },
      {
        thumbnailUrl: '/images/keywords/yu-gi-oh-05.png',
        value: { en: 'yu-gi-oh art book', ja: '遊戯王アートブック' },
      },
    ],
  },
  {
    thumbnailUrl: '/images/keywords/bearbrick-01.png',
    value: { en: 'bearbrick', ja: 'ベアブリック' },
    children: [
      {
        thumbnailUrl: '/images/keywords/bearbrick-01.png',
        value: { en: 'bearbrick collaborations', ja: 'ベアブリック コラボレーション' },
      },
      {
        thumbnailUrl: '/images/keywords/bearbrick-02.png',
        value: { en: 'bearbrick 1000%', ja: 'ベアブリック 1000%' },
      },
      {
        thumbnailUrl: '/images/keywords/bearbrick-03.png',
        value: { en: 'bearbrick artist series', ja: 'ベアブリック アーティストシリーズ' },
      },
      {
        thumbnailUrl: '/images/keywords/bearbrick-04.png',
        value: { en: 'bearbrick event limited', ja: 'ベアブリック イベント限定' },
      },
      {
        thumbnailUrl: '/images/keywords/bearbrick-05.png',
        value: {
          en: 'bearbrick medicom toy special editions',
          ja: 'ベアブリック メディコムトイ特別版',
        },
      },
    ],
  },
]

export { recommendKeywords }

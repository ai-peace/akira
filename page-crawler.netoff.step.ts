import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import * as cheerio from 'cheerio'
import type { ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS, StockStatus } from '@/common/domains/types/stock-status'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { promptProductSaver } from '@/server/server-lib/prompt-lock'
import { buildQueryNetoffStep } from './build-query.netoff.step'

const productSchema = z.object({
  uniqueKey: z.string(),
  title: z.object({
    en: z.string(),
    ja: z.string(),
  }),
  price: z.number(),
  priceWithTax: z.number().optional(),
  currency: z.string(),
  condition: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  url: z.string().optional(),
  status: z.custom<StockStatus>(),
  itemCode: z.string(),
  shopName: z.string(),
  shopIconUrl: z.string(),
})

const pageCrawlerNetoffStep = new Step({
  id: 'pageCrawlerNetoffStep',
  inputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  outputSchema: z.object({
    products: z.array(productSchema),
  }),
  execute: async ({ context }) => {
    const keyword = context.getStepResult(buildQueryNetoffStep)?.keyword
    const options = context.getStepResult(buildQueryNetoffStep)?.options

    if (!keyword || !options) {
      throw new Error('Failed to get keyword or options')
    }

    try {
      // 1. 検索URLの構築
      const searchUrl = buildSearchUrl(keyword, options)

      // 2. ページのクローリング
      const products = await crawlProducts(searchUrl)

      return { products }
    } catch (e) {
      console.error('Error in page crawler:', e)
      return { products: [] }
    }
  },
})

function buildSearchUrl(keyword: string, options: Record<string, string>): string {
  const baseUrl = 'https://www.netoff.co.jp/figure/purchase/'
  const params = new URLSearchParams()

  // キーワードをURLエンコード
  params.append('ky', encodeURIComponent(keyword))

  // オプションパラメータの追加
  Object.entries(options).forEach(([key, value]) => {
    params.append(key, value)
  })

  return `${baseUrl}?${params.toString()}`
}

async function crawlProducts(url: string): Promise<ProductEntity[]> {
  // 1. ページの取得
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  })
  const html = await response.text()
  const $ = cheerio.load(html)

  // 2. 商品情報の抽出
  const products: ProductEntity[] = []

  $('.item').each((_, element) => {
    const $el = $(element)

    // 商品名
    const titleJa = $el.find('.item-name').text().trim()
    const titleEn = '' // 英語タイトルは提供されていない

    // 価格
    const priceText = $el.find('.item-price').text().trim()
    const price = parseInt(priceText.replace(/[^0-9]/g, ''))

    // 商品コード
    const itemCode = $el.find('.item-code').text().trim()

    // 商品URL
    const url = $el.find('a').attr('href')

    // 画像URL
    const imageUrl = $el.find('img').attr('src')

    // 在庫状態
    const statusText = $el.find('.item-status').text().trim()
    const status = mapStatusText(statusText)

    products.push({
      uniqueKey: generateUniqueKey(),
      title: {
        en: titleEn,
        ja: titleJa,
      },
      price,
      priceWithTax: Math.floor(price * 1.1), // 税込価格の計算
      currency: 'JPY',
      url,
      imageUrl,
      status,
      itemCode,
      shopName: 'もえたく！',
      shopIconUrl: 'https://www.netoff.co.jp/moetaku/images/common/logo.png',
    })
  })

  return products
}

function mapStatusText(status: string): StockStatus {
  switch (status.toLowerCase()) {
    case '在庫あり':
      return STOCK_STATUS.IN_STOCK
    case '在庫なし':
      return STOCK_STATUS.OUT_OF_STOCK
    default:
      return STOCK_STATUS.UNKNOWN
  }
}

export { pageCrawlerNetoffStep }

import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import * as cheerio from 'cheerio'
import type { ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS } from '@/common/domains/types/stock-status'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { buildQueryNetoffStep } from './build-query.step'

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
  status: z.enum(['available', 'requires user confirmation', 'out-of-stock', 'unknown']),
  itemCode: z.string(),
  shopName: z.string(),
  shopIconUrl: z.string(),
})

const pageCrawlerNetoffStep = new Step({
  name: 'pageCrawlerNetoffStep',
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
      const searchUrl = buildSearchUrl(keyword, options)
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
  params.append('ky', encodeURIComponent(keyword))
  Object.entries(options).forEach(([key, value]) => {
    params.append(key, value)
  })
  return `${baseUrl}?${params.toString()}`
}

async function crawlProducts(url: string): Promise<ProductEntity[]> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  })
  const html = await response.text()
  const $ = cheerio.load(html)
  const products: ProductEntity[] = []

  $('.item').each((_, element) => {
    const $el = $(element)
    const titleJa = $el.find('.item-name').text().trim()
    const titleEn = ''
    const priceText = $el.find('.item-price').text().trim()
    const price = parseInt(priceText.replace(/[^0-9]/g, ''))
    const itemCode = $el.find('.item-code').text().trim()
    const url = $el.find('a').attr('href')
    const imageUrl = $el.find('img').attr('src')
    const statusText = $el.find('.item-status').text().trim()
    const status = mapStatusText(statusText)

    products.push({
      uniqueKey: generateUniqueKey(),
      title: {
        en: titleEn,
        ja: titleJa,
      },
      price,
      priceWithTax: Math.floor(price * 1.1),
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

function mapStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case '在庫あり':
      return 'available'
    case '在庫なし':
      return 'out-of-stock'
    default:
      return 'unknown'
  }
}

export { pageCrawlerNetoffStep }

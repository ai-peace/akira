import type { ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS, StockStatus } from '@/common/domains/types/stock-status'
import { Step } from '@mastra/core/workflows'
import * as cheerio from 'cheerio'
import { z } from 'zod'
import { pageCrawlerMandarakeStep } from './page-crawler.mandarake.step'
import { generateUniqueKey } from '@/server/server-lib/uuid'

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
}) satisfies z.ZodType<ProductEntity>

const mapProductEntityMandarakeStep = new Step({
  id: 'mapProductEntityMandarakeStep',
  inputSchema: z.object({
    pages: z.array(z.string()),
  }),
  outputSchema: z.object({
    products: z.array(productSchema),
  }),
  execute: async ({ context }) => {
    const pages = context.getStepResult(pageCrawlerMandarakeStep)?.pages
    if (!pages) {
      throw new Error('Failed to get pages')
    }

    console.log('Processing pages:', pages.length)

    const products: ProductEntity[] = []

    // 全てのページを処理
    for (const page of pages) {
      const $ = cheerio.load(page)
      console.log('Processing page...')

      // 商品一覧の要素を取得
      $('.block').each((_, element) => {
        try {
          const $item = $(element)

          // 商品情報を抽出
          const jaTitle = $item.find('.title').text().trim()
          const priceText = $item.find('.price').text().trim()

          // 価格の解析
          const basePrice = priceText.match(/^[\d,]+/)?.[0] || ''
          const taxIncludedPrice = priceText.match(/\(税込\s*([\d,]+)円\)/)?.[1] || ''

          const price = parseInt(basePrice.replace(/,/g, '')) || 0
          const priceWithTax = parseInt(taxIncludedPrice.replace(/,/g, '')) || 0

          if (!jaTitle || !price) {
            console.log('Skipping item due to missing title or price:', { jaTitle, price })
            return
          }

          const url = $item.find('.title a').attr('href') || ''
          const imageUrl = $item.find('.thum img').attr('src') || ''
          const statusText = $item.find('.stock').text().trim()
          const shopInfo = $item.find('.shop').text().trim()
          const itemCode = $item.find('.itemno').text().trim()
          const priceRange = $item.find('.price_range').text().trim()

          // 在庫状態の変換
          let status: StockStatus = STOCK_STATUS.UNKNOWN

          switch (statusText) {
            case '在庫あり':
              status = STOCK_STATUS.AVAILABLE
              break
            case '在庫あります':
              status = STOCK_STATUS.AVAILABLE
              break
            case '在庫確認します':
              status = STOCK_STATUS.REQUIRES_USER_CONFIRMATION
              break
            case '在庫なし':
              status = STOCK_STATUS.OUT_OF_STOCK
              break
            case '':
              status = STOCK_STATUS.OUT_OF_STOCK
              break
            default:
              status = STOCK_STATUS.UNKNOWN
          }

          products.push({
            uniqueKey: generateUniqueKey(),
            title: {
              en: jaTitle, // 英語タイトルは日本語と同じ
              ja: jaTitle,
            },
            price,
            priceWithTax,
            currency: 'JPY',
            condition: '',
            description: priceRange,
            url: url.startsWith('http') ? url : `https://order.mandarake.co.jp${url}`,
            imageUrl: imageUrl.startsWith('http')
              ? imageUrl
              : `https://order.mandarake.co.jp${imageUrl}`,
            status,
            itemCode,
            shopName: 'mandarake',
            shopIconUrl: 'https://www.mandarake.co.jp/favicon.ico',
          })
        } catch (itemError) {
          console.error('Error parsing item data:', itemError)
        }
      })
    }

    console.log(`Extracted ${products.length} products from ${pages.length} pages`)
    console.log(products, 'mandarake')

    // データベース保存処理を削除しました

    return { products }
  },
})

export { mapProductEntityMandarakeStep }

const getResultMessage = (products: ProductEntity[], isPartial: boolean = false) => {
  if (products.length === 0) {
    return 'No items found matching your search.'
  }
  return `Found ${products.length} items${isPartial ? ' so far' : ''} matching your search.`
}

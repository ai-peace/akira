import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import * as cheerio from 'cheerio'
import { pageCrawlerStep } from './page-crawler.surugaya.step'
import * as fs from 'fs'
import * as path from 'path'

const productItemSchema = z.object({
  title: z.object({
    ja: z.string(),
    en: z.string(),
  }),
  price: z.number(),
  priceWithTax: z.number(),
  url: z.string(),
  imageUrl: z.string(),
  status: z.string(),
  condition: z.string(),
  itemCode: z.string(),
  shopName: z.string(),
  shopIconUrl: z.string(),
  isNewArrival: z.boolean().optional(),
  shopInfo: z.string().optional(),
})

type ProductItemEntity = z.infer<typeof productItemSchema>

export const mapProductEntityStep = new Step({
  id: 'mapProductEntityStep',
  inputSchema: z.object({
    pages: z.array(z.string()),
  }),
  outputSchema: z.object({
    products: z.array(productItemSchema),
  }),
  execute: async ({ context }) => {
    const pages = context.getStepResult(pageCrawlerStep)?.pages
    if (!pages) {
      throw new Error('Failed to get pages')
    }

    console.log('Processing pages:', pages.length)
    const products: ProductItemEntity[] = []

    for (const [index, page] of pages.entries()) {
      const $ = cheerio.load(page)
      console.log('Processing page...', page)

      // デバッグ用にHTMLを保存
      try {
        const debugDir = path.join(process.cwd(), 'debug')
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true })
        }
        fs.writeFileSync(path.join(debugDir, `surugaya-page-${index + 1}.html`), page)
        console.log(`Saved debug HTML to surugaya-page-${index + 1}.html`)
      } catch (error) {
        console.error('Failed to save debug HTML:', error)
      }

      $('#search_result .item, .item_list li').each((_, element) => {
        try {
          const $item = $(element)

          // タイトルと商品URL
          const $titleLink = $item.find('.title_link, .title h3.product-name')
          const jaTitle = $titleLink.text().trim()
          const url = $titleLink.attr('href') || $item.find('.title a').attr('href') || ''
          const fullUrl = url.startsWith('http') ? url : `https://www.suruga-ya.jp${url}`

          // 価格情報の取得
          const priceText = $item.find('.price_teika').text().trim()
          let price = 0
          let priceWithTax = 0

          // 通常価格のパース
          const normalPriceMatch = priceText.match(/[￥¥]([\d,]+)/)
          if (normalPriceMatch) {
            price = parseInt(normalPriceMatch[1].replace(/[^\d]/g, ''))
            priceWithTax = price
          }

          // 税込価格の取得
          const taxIncludedText = $item.find('.price_taxin').text().trim()
          if (taxIncludedText) {
            const taxMatch = taxIncludedText.match(/[￥¥]([\d,]+)/)
            if (taxMatch) {
              priceWithTax = parseInt(taxMatch[1].replace(/[^\d]/g, ''))
            }
          }

          // 商品画像URL
          const imageUrl =
            $item.find('.photo_box img, .thum img').attr('data-src') ||
            $item.find('.photo_box img, .thum img').attr('src') ||
            ''
          const fullImageUrl = imageUrl.startsWith('http')
            ? imageUrl
            : `https://www.suruga-ya.jp${imageUrl}`

          // 商品状態
          const status =
            $item.find('.stock_status, .status_text').text().trim() ||
            ($item.find('.price').text().includes('品切れ') ? '品切れ' : '在庫あり')

          // 商品の状態（コンディション）
          const condition = $item.find('.condition_text, .condition').text().trim() || '状態不明'

          // 商品コード
          let itemCode = ''
          const itemCodeText = $item.find('.item_code').text().trim()
          const itemCodeMatch = url.match(/detail\/(\d+)/) || itemCodeText.match(/(\d+)/)
          if (itemCodeMatch) {
            itemCode = itemCodeMatch[1]
          } else {
            itemCode = url.split('/').pop()?.split('.')[0] || '0'
          }

          // ブランド情報
          const brandMatch = $item
            .find('.brand')
            .text()
            .match(/\[(.*?)\]/)
          const shopInfo = brandMatch ? brandMatch[1].trim() : ''

          // 新着フラグ
          const isNewArrival = $item.find('.new_arrival').length > 0

          if (!jaTitle || !price) {
            console.log('Skipping item due to missing required fields:', { jaTitle, price })
            return
          }

          products.push({
            title: {
              ja: jaTitle,
              en: jaTitle, // 英語タイトルは現時点では日本語と同じ
            },
            price,
            priceWithTax,
            url: fullUrl,
            imageUrl: fullImageUrl,
            status,
            condition,
            itemCode,
            shopName: 'surugaya',
            shopIconUrl: 'https://www.suruga-ya.jp/favicon.ico',
            isNewArrival,
            shopInfo,
          })
        } catch (itemError) {
          console.error('Error parsing item data:', itemError)
        }
      })
    }

    console.log(products, 'surugaya')
    console.log(`Extracted ${products.length} products from ${pages.length} pages`)
    return { products }
  },
})

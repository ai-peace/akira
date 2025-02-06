import { Tool } from '@langchain/core/tools'
import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer'
import { saveHtml } from '../utils/save-html'
import { ProductItemEntity } from '../../domains/entities/product-item.entity'

export class MandarakeCrawlerTool extends Tool {
  name = 'mandarake_crawler'
  description = 'Search for rare items on Mandarake'

  async _call(keyword: string): Promise<string> {
    try {
      const items = await this.searchItems(keyword)
      return JSON.stringify(items, null, 2)
    } catch (error: unknown) {
      if (error instanceof Error) {
        return JSON.stringify({ error: 'Failed to search items', details: error.message })
      }
      return JSON.stringify({ error: 'Failed to search items', details: 'Unknown error occurred' })
    }
  }

  private async searchItems(keyword: string): Promise<ProductItemEntity[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        // '--no-sandbox',
        // '--disable-setuid-sandbox',
        // '--ignore-certificate-errors',
        // '--ignore-certificate-errors-spki-list',
        // 必要最小限の設定
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
      ],
    })
    const page = await browser.newPage()
    const items: ProductItemEntity[] = []

    try {
      const url = `https://order.mandarake.co.jp/order/listPage/list?keyword=${encodeURIComponent(keyword)}`
      console.log('url-----------', url)
      await page.setViewport({ width: 1280, height: 800 })
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      )

      console.log('\n')
      console.log('================================================================')
      console.log('                          PAGE 1                                 ')
      console.log('================================================================')
      console.log('\n')

      const response = await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      console.log('response-----------')
      console.log(response)
      console.log('+++++++++++++++++++++++++++++++++++++')

      if (!response) {
        throw new Error('Failed to get response from page')
      }

      if (!response.ok()) {
        throw new Error(`HTTP error! status: ${response.status()}`)
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
      const content = await page.content()
      console.log('HTML Content:')
      console.log('================================================================')
      console.log(content)
      console.log('================================================================')

      await saveHtml('mandarake', content, ['tmp', 'cache'])

      const $ = cheerio.load(content)

      const entries = $('.block')

      if (entries.length === 0) return []

      entries.each((_, element) => {
        try {
          const title = $(element).find('.title').text().trim()
          const priceText = $(element).find('.price').text().trim()

          // 税抜価格と税込価格を抽出
          const basePrice = priceText.match(/^[\d,]+/)?.[0] || ''
          const taxIncludedPrice = priceText.match(/\(税込\s*([\d,]+)円\)/)?.[1] || ''

          // カンマを除去して数値に変換
          const price = parseInt(basePrice.replace(/,/g, '')) || 0
          const priceWithTax = parseInt(taxIncludedPrice.replace(/,/g, '')) || 0

          const url = $(element).find('.title a').attr('href') || ''
          const imageUrl = $(element).find('.thum img').attr('src') || ''
          const status = $(element).find('.stock').text().trim()
          const shopInfo = $(element).find('.shop').text().trim()
          const itemCode = $(element).find('.itemno').text().trim()
          const priceRange = $(element).find('.price_range').text().trim()

          if (title && price) {
            items.push({
              title,
              price,
              priceWithTax,
              url: url.startsWith('http') ? url : `https://order.mandarake.co.jp${url}`,
              imageUrl: imageUrl.startsWith('http')
                ? imageUrl
                : `https://order.mandarake.co.jp${imageUrl}`,
              status,
              shopInfo,
              itemCode,
              priceRange,
              isNewArrival: $(element).find('.new_arrival').length > 0,
            })
          }
        } catch (itemError) {
          console.error('商品データの解析中にエラーが発生しました:', itemError)
        }
      })

      console.log('items-----------', items, 'items--------|||||||||')

      return items
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred during crawling')
    } finally {
      await browser.close()
    }
  }
}

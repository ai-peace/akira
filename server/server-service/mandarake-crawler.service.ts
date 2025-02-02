import { Tool } from '@langchain/core/tools'
import puppeteer, { type Page } from 'puppeteer'
import * as cheerio from 'cheerio'

interface MandarakeItem {
  title: string
  price: number
  url: string
  imageUrl: string
  status: string
  shopInfo: string
  itemCode: string
  priceRange: string
  isNewArrival: boolean
}

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

  private async searchItems(keyword: string): Promise<MandarakeItem[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
      ],
    })
    const page = await browser.newPage()
    const items: MandarakeItem[] = []

    try {
      const url = `https://order.mandarake.co.jp/order/listPage/list?keyword=${encodeURIComponent(keyword)}`
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
      const $ = cheerio.load(content)

      const entries = $('.block')
      if (entries.length === 0) {
        throw new Error('商品が見つかりませんでした')
      }

      entries.each((_, element) => {
        try {
          const title = $(element).find('.title').text().trim()
          const priceText = $(element).find('.price').text().trim()
          const price = parseInt(priceText.replace(/[^0-9]/g, ''))
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

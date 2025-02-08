import { Tool } from '@langchain/core/tools'
import * as cheerio from 'cheerio'
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
    const url = `https://order.mandarake.co.jp/order/listPage/list?keyword=${encodeURIComponent(keyword)}`

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000) // 8秒でタイムアウト

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal, // AbortControllerを追加
      })

      clearTimeout(timeout) // タイムアウトをクリア

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentLength = response.headers.get('content-length')

      if (contentLength && parseInt(contentLength) > 4_000_000) {
        throw new Error('Response too large')
      }

      const chunks = []
      const reader = response.body?.getReader()
      if (!reader) throw new Error('Failed to get response reader')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }

      // チャンクの結合方法を修正
      const allChunks = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
      let position = 0
      for (const chunk of chunks) {
        allChunks.set(chunk, position)
        position += chunk.length
      }

      const content = new TextDecoder().decode(allChunks)

      const $ = cheerio.load(content)
      const items: ProductItemEntity[] = []

      $('.block').each((_, element) => {
        try {
          const title = $(element).find('.title').text().trim()
          const priceText = $(element).find('.price').text().trim()

          const basePrice = priceText.match(/^[\d,]+/)?.[0] || ''
          const taxIncludedPrice = priceText.match(/\(税込\s*([\d,]+)円\)/)?.[1] || ''

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

      return items
    } catch (error: unknown) {
      if (error instanceof Error) throw error

      throw new Error('Unknown error occurred during crawling')
    }
  }
}

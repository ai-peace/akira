import { Tool } from '@langchain/core/tools'
import * as cheerio from 'cheerio'
import { ProductItemEntity } from '../../domains/entities/product-item.entity'
import { OpenAI } from 'openai'
import { saveHtml } from '../utils/save-html'

export class MandarakeCrawlerTool extends Tool {
  private openai: OpenAI

  constructor(apiKey: string) {
    super()
    this.openai = new OpenAI({ apiKey })
  }

  name = 'mandarake_crawler'
  description = 'Search for rare items on Mandarake'

  private async translateTitle(jaTitle: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a translator specializing in Japanese anime, manga, and collectibles. Translate the following Japanese product title to English. Keep proper nouns as is.',
          },
          {
            role: 'user',
            content: jaTitle,
          },
        ],
        temperature: 0,
      })

      return response.choices[0]?.message?.content || jaTitle
    } catch (error) {
      console.error('Error translating title:', error)
      return jaTitle
    }
  }

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
      const timeout = setTimeout(() => controller.abort(), 8000)

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
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const chunks = []
      const reader = response.body?.getReader()
      if (!reader) throw new Error('Failed to get response reader')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }

      const allChunks = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
      let position = 0
      for (const chunk of chunks) {
        allChunks.set(chunk, position)
        position += chunk.length
      }

      const content = new TextDecoder().decode(allChunks)
      saveHtml('mandarake', content, ['tmp'])
      const $ = cheerio.load(content)

      const processedItems = await Promise.all(
        $('.block')
          .map(async (_, element) => {
            try {
              const jaTitle = $(element).find('.title').text().trim()
              const priceText = $(element).find('.price').text().trim()

              const basePrice = priceText.match(/^[\d,]+/)?.[0] || ''
              const taxIncludedPrice = priceText.match(/\(税込\s*([\d,]+)円\)/)?.[1] || ''

              const price = parseInt(basePrice.replace(/,/g, '')) || 0
              const priceWithTax = parseInt(taxIncludedPrice.replace(/,/g, '')) || 0

              if (!jaTitle || !price) {
                return null
              }

              const url = $(element).find('.title a').attr('href') || ''
              const imageUrl = $(element).find('.thum img').attr('src') || ''
              const status = $(element).find('.stock').text().trim()
              const shopInfo = $(element).find('.shop').text().trim()
              const itemCode = $(element).find('.itemno').text().trim()
              const priceRange = $(element).find('.price_range').text().trim()

              const enTitle = await this.translateTitle(jaTitle)

              return {
                title: {
                  en: enTitle,
                  ja: jaTitle,
                },
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
              }
            } catch (itemError) {
              console.error('Error parsing item data:', itemError)
              return null
            }
          })
          .get(),
      )

      const filteredItems = processedItems.filter(
        (item): item is ProductItemEntity => item !== null,
      )
      return filteredItems
    } catch (error: unknown) {
      if (error instanceof Error) throw error
      throw new Error('Unknown error occurred during crawling')
    }
  }
}

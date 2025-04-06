import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildQueryMoetakuStep } from './build-query.moetaku.step'
import type { Browser } from 'playwright'
import { WorkflowContext } from '@mastra/core/workflows'

type PageCrawlerInput = {
  browser: Browser
}

const pageCrawlerMoetakuStep = new Step({
  id: 'pageCrawlerMoetakuStep',
  inputSchema: z.object({
    browser: z.any(), // Playwrightのブラウザインスタンスは実行時に検証
  }),
  outputSchema: z.object({
    products: z.array(
      z.object({
        title: z.string(),
        price: z.number(),
        status: z.string(),
        imageUrl: z.string(),
        productUrl: z.string(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const queryResult = context.getStepResult(buildQueryMoetakuStep)
    const { browser } = context.inputData as PageCrawlerInput

    if (!queryResult) throw new Error('Query result is required')

    const { keyword, options } = queryResult
    const baseUrl = 'https://www.netoff.co.jp/figure/purchase'

    // Build search URL
    const searchParams = new URLSearchParams()
    searchParams.append('ky', keyword)
    searchParams.append('t', 'w') // 必須パラメータとして追加
    Object.entries(options).forEach(([key, value]) => {
      searchParams.append(key, value)
    })

    const page = await browser.newPage()
    await page.setViewportSize({ width: 1280, height: 800 })

    try {
      // Navigate to search results
      const url = `${baseUrl}?${searchParams.toString()}`
      console.log('url', url)
      await page.goto(url)
      await page.waitForSelector('.product-list')

      // Extract product information
      const products = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.product-list .product-item'))
        return items.map((item) => ({
          title: item.querySelector('.product-title')?.textContent?.trim() || '',
          price: parseInt(item.querySelector('.price')?.textContent?.replace(/[^0-9]/g, '') || '0'),
          status: item.querySelector('.stock-status')?.textContent?.trim() || '',
          imageUrl: item.querySelector('.product-image img')?.getAttribute('src') || '',
          productUrl: item.querySelector('.product-link')?.getAttribute('href') || '',
        }))
      })

      return { products }
    } finally {
      await page.close()
    }
  },
})

export { pageCrawlerMoetakuStep }

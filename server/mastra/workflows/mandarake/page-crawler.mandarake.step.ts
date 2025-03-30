import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Step } from '@mastra/core/workflows'
import type { ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS, StockStatus } from '@/common/domains/types/stock-status'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { buildQueryMandarakeStep } from './build-query.mandarake.step'

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

const pageCrawlerMandarakeStep = new Step({
  id: 'pageCrawlerMandarakeStep',
  inputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  outputSchema: z.object({
    products: z.array(productSchema),
  }),
  execute: async ({ context }) => {
    const keyword = context.getStepResult(buildQueryMandarakeStep)?.keyword
    const options = context.getStepResult(buildQueryMandarakeStep)?.options
    if (!keyword || !options) {
      throw new Error('Failed to get keyword or options')
    }

    const response = await pageCrawlerAgent.stream([
      {
        role: 'user',
        content: JSON.stringify({ keyword, options }),
      },
    ])

    let result = ''
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk)
      result += chunk
    }

    try {
      const parsedResult = JSON.parse(result)
      const initialUrl = parsedResult.urls[0]
      console.log('Initial URL:', initialUrl)

      // 一時ディレクトリを作成
      const tmpDir = path.join(process.cwd(), 'tmp', 'mandarake-pages')
      console.log('Temporary directory path:', tmpDir)

      if (!fs.existsSync(tmpDir)) {
        console.log('Creating directory:', tmpDir)
        fs.mkdirSync(tmpDir, { recursive: true })
      }

      // 最初のページを取得して総ページ数を解析
      console.log('Fetching initial page to determine total pages')
      const initialResponse = await axios.get(initialUrl)
      const initialHtml = initialResponse.data
      const $ = cheerio.load(initialHtml)

      // 検索結果の総数を取得
      const totalCountText = $('.item_list_head .count').text().trim()
      const totalCount = parseInt(totalCountText.match(/\d+/)?.[0] || '0', 10)
      console.log('Total search results:', totalCount)

      // 1ページあたり48件で計算（最大5ページまで）
      const maxPage = Math.min(Math.ceil(totalCount / 48), 2)
      console.log(`Total pages to fetch: ${maxPage}`)

      // 全ページのURLを生成
      const urls = Array.from({ length: maxPage }, (_, i) =>
        initialUrl.replace(/page=\d+/, `page=${i + 1}`),
      )

      const products: ProductEntity[] = []

      // URLからHTMLを取得してProductEntityに変換
      await Promise.all(
        urls.map(async (url: string, index: number) => {
          try {
            console.log(`Fetching URL: ${url}`)
            const response = await axios.get(url)
            const html = response.data
            console.log(`Received HTML content length: ${html.length}`)

            // ファイル名を生成（ページ番号を含む）
            const fileName = `page_${index + 1}.html`
            const filePath = path.join(tmpDir, fileName)
            console.log(`Saving to file: ${filePath}`)

            // HTMLをファイルに保存
            fs.writeFileSync(filePath, html, 'utf-8')
            console.log(`Successfully saved HTML to: ${filePath}`)

            // HTMLからProductEntityに変換
            const pageProducts = mapHtmlToProducts(html)
            products.push(...pageProducts)

            console.log(`Extracted ${pageProducts.length} products from page ${index + 1}`)
            return pageProducts
          } catch (error) {
            console.error(`Failed to fetch ${url}:`, error)
            return []
          }
        }),
      )

      console.log(`Total products extracted: ${products.length}`)
      console.log(products, 'mandarake')

      return {
        products,
      }
    } catch (e) {
      console.error('Error in page crawler:', e)
      throw new Error('Failed to parse agent response or fetch pages')
    }
  },
})

export { pageCrawlerMandarakeStep }

// HTMLをProductEntityに変換する関数
const mapHtmlToProducts = (html: string): ProductEntity[] => {
  const $ = cheerio.load(html)
  const products: ProductEntity[] = []

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
      } else {
        console.log('Item:', { jaTitle, price })
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

  return products
}

const pageCrawlerAgent = new Agent({
  name: 'pageCrawlerAgent',
  instructions: `あなたはMandarakeの検索結果ページのURLを生成するアシスタントです。
入力されたキーワードとオプションに基づいて、検索結果のページURLを生成してください。

入力形式:
{
  "keyword": "検索キーワード",
  "options": {
    // URLクエリパラメータ
  }
}

出力形式:
{
  "urls": [
    "https://order.mandarake.co.jp/order/listPage/list?page=1&keyword=コミック&soldOut=1&sort=price&sortOrder=1&dispAdult=0"
  ]
}

ルール:
1. 基本的なURL形式:
   - ベースURL: https://order.mandarake.co.jp/order/listPage/list
   - 必須パラメータ: page, keyword
   - オプションパラメータ: 入力されたoptionsの内容

2. ページ数の決定:
   - 最初は1ページ目のURLのみを返す
   - 実際のページ数は実行時に動的に取得される

3. パラメータの結合:
   - オプションは&で結合
   - キーワードはURLエンコード

ユーザーの入力に基づいて、適切な検索結果ページのURLを生成してください。`,
  model: openai('gpt-4o-mini'),
})

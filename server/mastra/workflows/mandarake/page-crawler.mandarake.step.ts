import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Step } from '@mastra/core/workflows'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { buildQueryStep } from './build-query.mandarake.step'
import * as cheerio from 'cheerio'

const pageCrawlerStep = new Step({
  id: 'pageCrawlerStep',
  inputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  outputSchema: z.object({
    pages: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const keyword = context.getStepResult(buildQueryStep)?.keyword
    const options = context.getStepResult(buildQueryStep)?.options
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
      const maxPage = Math.min(Math.ceil(totalCount / 48), 1)
      console.log(`Total pages to fetch: ${maxPage}`)

      // 全ページのURLを生成
      const urls = Array.from({ length: maxPage }, (_, i) =>
        initialUrl.replace(/page=\d+/, `page=${i + 1}`),
      )

      // URLからHTMLを取得して保存
      const pages = await Promise.all(
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

            return html
          } catch (error) {
            console.error(`Failed to fetch ${url}:`, error)
            return null
          }
        }),
      )

      console.log(`Total pages saved: ${pages.filter((p) => p !== null).length}`)
      return {
        pages: pages.filter((page): page is string => page !== null),
      }
    } catch (e) {
      console.error('Error in page crawler:', e)
      throw new Error('Failed to parse agent response or fetch pages')
    }
  },
})

export { pageCrawlerStep }

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

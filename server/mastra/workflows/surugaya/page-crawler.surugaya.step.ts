import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildQuerySurugayaStep } from './build-query.surugaya.step'
import fs from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'

const pageCrawlerSurugayaStep = new Step({
  id: 'pageCrawlerStep',
  inputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  outputSchema: z.object({
    pages: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const keyword = context.getStepResult(buildQuerySurugayaStep)?.keyword
    const options = context.getStepResult(buildQuerySurugayaStep)?.options
    if (!keyword || !options) {
      throw new Error('Failed to get keyword or options')
    }

    try {
      // 検索URLの構築
      const baseUrl = 'https://www.suruga-ya.jp/search'
      const searchParams = new URLSearchParams()
      searchParams.append('search_word', keyword)
      // オプションを追加
      Object.entries(options).forEach(([key, value]) => {
        if (key !== 'search_word') {
          searchParams.append(key, value)
        }
      })
      const initialUrl = `${baseUrl}?${searchParams.toString()}`
      console.log('Initial URL:', initialUrl)

      // 一時ディレクトリを作成
      const tmpDir = path.join(process.cwd(), 'tmp', 'surugaya-pages')
      console.log('Temporary directory path:', tmpDir)

      if (!fs.existsSync(tmpDir)) {
        console.log('Creating directory:', tmpDir)
        fs.mkdirSync(tmpDir, { recursive: true })
      }

      // 最初のページを取得して総ページ数を解析
      console.log('Fetching initial page to determine total pages')
      const initialResponse = await fetch(initialUrl, {
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
        redirect: 'follow',
      })

      if (!initialResponse.ok) {
        throw new Error(`HTTP error! status: ${initialResponse.status}`)
      }

      // リダイレクト後のURLを取得
      const finalUrl = initialResponse.url
      console.log('Final URL after redirect:', finalUrl)

      // レスポンスをテキストとして取得
      const initialHtml = await initialResponse.text()
      const $ = cheerio.load(initialHtml)

      // 検索結果の総数を取得
      const totalItemsText =
        $('body')
          .text()
          .match(/該当件数:([0-9,]+)件/)?.[1] || '0'
      const totalItems = parseInt(totalItemsText.replace(/,/g, ''))
      console.log('Total search results:', totalItems)

      // 1ページあたり24件で計算（テスト用に1ページのみに制限）
      const maxPage = Math.min(Math.ceil(totalItems / 24), 2)
      console.log(`Total pages to fetch: ${maxPage}`)

      // 全ページのURLを生成
      const urls = Array.from({ length: maxPage }, (_, i) => {
        const pageParams = new URLSearchParams(searchParams)
        pageParams.set('page', (i + 1).toString())
        return `${baseUrl}?${pageParams.toString()}`
      })

      // URLからHTMLを取得して保存
      const pages = await Promise.all(
        urls.map(async (url: string, index: number) => {
          try {
            console.log(`Fetching URL: ${url}`)
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
                Referer: initialUrl,
              },
              signal: controller.signal,
              redirect: 'follow',
            })
            clearTimeout(timeout)

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            // リダイレクト後のURLを取得
            const finalUrl = response.url
            console.log(`Final URL after redirect: ${finalUrl}`)

            // レスポンスをチャンクで読み込む
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

            const html = new TextDecoder().decode(allChunks)
            console.log(`Received HTML content length: ${html.length}`)

            // HTMLを保存
            const fileName = `page_${index + 1}.html`
            const filePath = path.join(tmpDir, fileName)
            console.log(`Saving HTML to: ${filePath}`)
            fs.writeFileSync(filePath, html, 'utf-8')

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
      throw new Error('Failed to fetch pages')
    }
  },
})

export { pageCrawlerSurugayaStep }

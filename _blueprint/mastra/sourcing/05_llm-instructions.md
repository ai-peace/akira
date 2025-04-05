# ECサイト解析とステップ実装のためのLLM指示ガイド

このガイドに従って、指定されたECサイトの検索機能を実装するための2つのステップを作成してください：

1. クエリビルダーステップ（build-query.{サイト名}.step.ts）
2. ページクローラーステップ（page-crawler.{サイト名}.step.ts）

## 参考実装

以下の実装を参考にしてください：

- Mandarake実装: server/mastra/workflows/mandarake/
- Surugaya実装: server/mastra/workflows/surugaya/

## 1. サイト解析フェーズ

まず、以下の手順でサイトの解析を行ってください：

1. ブラウザでの基本調査

```typescript
// 1. サイトにアクセスして検索機能を確認
await mcp_playwright_browser_navigate({ url: targetSite })

// 2. 検索フォームの特定
await mcp_playwright_browser_snapshot()

// 3. テスト検索の実行
// 例: 「新品 フィギュア」で検索
await mcp_playwright_browser_type({
  element: '検索フォーム',
  ref: '検索フォームのref',
  text: '新品 フィギュア',
  submit: true,
})

// 4. 検索結果ページのスナップショット
await mcp_playwright_browser_snapshot()

// 5. フィルターやソートオプションの確認
await mcp_playwright_browser_snapshot()

// 6. ネットワークログの確認
await mcp_browser_tools_mcp_getNetworkLogs()
```

2. 検索URLの構造解析

- 基本検索URL
- クエリパラメータの意味
- フィルターパラメータの形式
- ページネーションの方法

3. HTML構造の解析

- 商品リストのセレクタ
- 各商品要素のセレクタ
- ページネーション要素

出力形式：

```json
{
  "baseUrl": "検索のベースURL",
  "searchParameters": {
    "必須パラメータ": "説明",
    "オプションパラメータ": {
      "パラメータ名": ["可能な値のリスト"]
    }
  },
  "htmlStructure": {
    "productList": "セレクタ",
    "productItem": {
      "title": "セレクタ",
      "price": "セレクタ",
      "status": "セレクタ"
    }
  },
  "constraints": {
    "rateLimit": "制限値",
    "requiredHeaders": ["ヘッダーリスト"],
    "specialHandling": ["特別な処理が必要な項目"]
  }
}
```

## 2. クエリビルダーステップの実装

以下のテンプレートを使用して、build-query.{サイト名}.step.tsを実装してください：

```typescript
import { Step } from '@mastra/core/workflows'
import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { translateStep } from '../common/translate.step'

const buildQuery{サイト名}Step = new Step({
  id: 'buildQuery{サイト名}Step',
  inputSchema: z.object({
    translatedKeyword: z.string(),
  }),
  outputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  execute: async ({ context }) => {
    const translatedResult = context.getStepResult(translateStep)
    const translatedKeyword = translatedResult?.translatedKeyword

    if (!translatedKeyword) throw new Error('Translated keyword is required')

    const response = await buildQueryAgent.stream([
      {
        role: 'user',
        content: translatedKeyword,
      },
    ])

    let result = ''
    for await (const chunk of response.textStream) {
      result += chunk
    }

    try {
      const parsedResult = JSON.parse(result)
      return {
        keyword: parsedResult.keyword,
        options: parsedResult.options || {},
      }
    } catch (e) {
      throw new Error('Failed to parse agent response')
    }
  },
})

const buildQueryAgent = new Agent({
  name: '{サイト名}-query-builder',
  model: openai('gpt-4o-mini'),
  instructions: `
    あなたは{サイト名}の検索クエリを構築するアシスタントです。
    ユーザーの入力から検索キーワードとオプションを抽出し、適切な形式に整形してください。

    検索パラメータの仕様：
    {サイト解析フェーズで得られたパラメータ仕様を記述}

    処理のルール：
    1. キーワードからは検索に関係ない指示語を除外
    2. 以下の優先順位でパラメータを設定：
       - 在庫状態（デフォルト: 在庫あり）
       - 商品状態
       - 価格範囲
       - カテゴリー
       - ソート順

    出力形式：
    {
      "keyword": "検索キーワード",
      "options": {
        // URLクエリパラメータ
      }
    }
  `
})

export { buildQuery{サイト名}Step }
```

## 3. ページクローラーステップの実装

以下のテンプレートを使用して、page-crawler.{サイト名}.step.tsを実装してください：

```typescript
import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import * as cheerio from 'cheerio'
import type { ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS, StockStatus } from '@/common/domains/types/stock-status'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { promptProductSaver } from '@/server/server-lib/prompt-lock'
import { buildQuery{サイト名}Step } from './build-query.{サイト名}.step'

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
})

const pageCrawler{サイト名}Step = new Step({
  id: 'pageCrawler{サイト名}Step',
  inputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  outputSchema: z.object({
    products: z.array(productSchema),
  }),
  execute: async ({ context }) => {
    const keyword = context.getStepResult(buildQuery{サイト名}Step)?.keyword
    const options = context.getStepResult(buildQuery{サイト名}Step)?.options
    const promptUniqueKey = context.triggerData?.promptUniqueKey as string

    if (!keyword || !options) {
      throw new Error('Failed to get keyword or options')
    }

    try {
      // 1. 検索URLの構築
      const baseUrl = '{サイト解析フェーズで得られたベースURL}'
      const searchParams = new URLSearchParams()
      searchParams.append('keyword', keyword)
      Object.entries(options).forEach(([key, value]) => {
        searchParams.append(key, value)
      })
      const initialUrl = `${baseUrl}?${searchParams.toString()}`

      // 2. 初期ページの取得
      const response = await fetch(initialUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 ...',
          // その他必要なヘッダー
        }
      })

      // 3. 総ページ数の取得
      const html = await response.text()
      const $ = cheerio.load(html)
      const totalItems = extractTotalItemCount($)
      const maxPage = Math.min(Math.ceil(totalItems / itemsPerPage), 5)

      // 4. 全ページのURL生成
      const urls = Array.from({ length: maxPage }, (_, i) => {
        const pageParams = new URLSearchParams(searchParams)
        pageParams.set('page', (i + 1).toString())
        return `${baseUrl}?${pageParams.toString()}`
      })

      // 5. 並行処理でページを取得
      const allProducts: ProductEntity[] = []
      await Promise.all(
        urls.map(async (url, index) => {
          try {
            // レート制限対策
            await new Promise(resolve => setTimeout(resolve, index * 500))

            const response = await fetch(url, {
              headers: { /* ... */ }
            })
            const html = await response.text()

            // 商品情報の抽出
            const pageProducts = mapHtmlToProducts(html)

            // 進捗状況の保存
            let lockAcquired = false
            try {
              lockAcquired = promptProductSaver.acquireLock(promptUniqueKey)
              if (lockAcquired) {
                const isPartial = index < urls.length - 1
                await promptProductSaver.saveProducts(
                  promptUniqueKey,
                  pageProducts,
                  '{サイト名}',
                  isPartial
                )
              }
            } finally {
              if (lockAcquired) {
                promptProductSaver.releaseLock(promptUniqueKey)
              }
            }

            allProducts.push(...pageProducts)
          } catch (error) {
            console.error(`Failed to fetch ${url}:`, error)
          }
        })
      )

      return { products: allProducts }
    } catch (e) {
      console.error('Error in page crawler:', e)
      return { products: [] }
    }
  },
})

// HTML解析関数
const mapHtmlToProducts = (html: string): ProductEntity[] => {
  const $ = cheerio.load(html)
  const products: ProductEntity[] = []

  $('{商品リストのセレクタ}').each((_, element) => {
    try {
      const $item = $(element)

      // サイト解析フェーズで得られたセレクタを使用して情報を抽出
      const title = $item.find('{タイトルセレクタ}').text().trim()
      const price = parsePrice($item.find('{価格セレクタ}').text())
      const status = mapStockStatus($item.find('{在庫状態セレクタ}').text())

      products.push({
        uniqueKey: generateUniqueKey(),
        title: { ja: title, en: title },
        price,
        currency: 'JPY',
        status,
        // その他の必要なフィールド
      })
    } catch (error) {
      console.error('Error parsing item:', error)
    }
  })

  return products
}

export { pageCrawler{サイト名}Step }
```

## 使用方法

1. サイト解析フェーズを実行し、必要な情報を収集
2. クエリビルダーステップを実装
3. ページクローラーステップを実装
4. 実装したステップをワークフローに追加

```typescript
sourcingWorkflow
  .step(translateStep)
  .after(translateStep)
    .step(buildQuery{サイト名}Step)
    .then(pageCrawler{サイト名}Step)
  .commit()
```

## 注意事項

1. レート制限への対応

   - 適切な待機時間の設定
   - ヘッダーの設定
   - エラー時のリトライ

2. エラーハンドリング

   - ネットワークエラー
   - 不正なHTML
   - CAPTCHA検出

3. パフォーマンス
   - 並行処理数の調整
   - メモリ使用量の監視
   - タイムアウトの設定

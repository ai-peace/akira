# ECサイト解析とステップ実装のためのLLM指示ガイド

このガイドに従って、指定されたECサイトの検索機能を実装するための2つのステップを作成してください：

1. クエリビルダーステップ（build-query.{サイト名}.step.ts）
2. ページクローラーステップ（page-crawler.{サイト名}.step.ts）

## 参考実装

以下の実装を参考にしてください：

- Mandarake実装: server/mastra/workflows/mandarake/
- Surugaya実装: server/mastra/workflows/surugaya/

## 0. サイト特定フェーズ

```typescript
interface SiteInfo {
  mainUrl: string
  searchUrl: string
  features?: {
    supportsFetch: boolean
    requiresJS: boolean
    hasCaptcha: boolean
  }
}

// 1. サイト名からURLを特定（必須プロセス）
async function identifySiteUrl(siteName: string): Promise<SiteInfo> {
  // LLMに尋ねる（複数回試行）
  const maxAttempts = 3
  let attempt = 0
  let response = null

  while (attempt < maxAttempts) {
    try {
      response = await new Agent({
        name: 'site-identifier',
        model: openai('gpt-4-mini'),
        instructions: `
          あなたは日本のECサイトに詳しいアシスタントです。
          与えられたサイト名から、そのサイトのメインURLを特定してください。
          
          必須条件：
          1. URLが実在するサイトであること
          2. 日本のECサイトであること
          3. HTTPSであること
          
          出力形式：
          {
            "mainUrl": "https://example.com",
            "searchUrl": "https://example.com/search" // 既知の場合のみ
          }
          
          不明な場合は null を返してください。
        `,
      }).execute(siteName)

      if (!response || !response.mainUrl) {
        throw new Error('サイトURLを特定できませんでした')
      }

      // URLの妥当性チェック
      const url = new URL(response.mainUrl)
      if (!url.protocol.startsWith('https')) {
        throw new Error('HTTPSでないURLは使用できません')
      }

      break
    } catch (e) {
      attempt++
      if (attempt === maxAttempts) {
        throw new Error(`サイトの特定に失敗しました: ${e.message}`)
      }
      // 少し待ってリトライ
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  // MCPで検証
  try {
    await mcp_playwright_browser_navigate({ url: response.mainUrl })
    const snapshot = await mcp_playwright_browser_snapshot()

    // ページの有効性チェック
    if (!isValidPage(snapshot)) {
      throw new Error('無効なページが返されました')
    }

    // ネットワークログを初期化
    await mcp_browser_tools_mcp_wipeLogs()

    // 検索フォームを探して使用
    const searchForm = findSearchForm(snapshot)

    if (!searchForm) {
      throw new Error('検索フォームが見つかりません')
    }

    // テスト検索を実行
    await mcp_playwright_browser_type({
      element: 'search input',
      ref: searchForm.ref,
      text: 'テスト',
      submit: true,
    })

    // 検索URLを取得
    const logs = await mcp_browser_tools_mcp_getNetworkLogs()
    const searchUrl = extractSearchUrl(logs)

    if (!searchUrl) {
      throw new Error('検索URLを特定できませんでした')
    }

    return {
      mainUrl: response.mainUrl,
      searchUrl: searchUrl,
    }
  } catch (e) {
    throw new Error(`サイトの検証に失敗しました: ${e.message}`)
  }
}

// 2. サイトの基本情報を収集（必須プロセス）
async function analyzeSite(siteName: string): Promise<SiteInfo> {
  // 1. サイトURLの特定
  const siteInfo = await identifySiteUrl(siteName)
  if (!siteInfo) {
    throw new Error('サイト情報の取得に失敗しました')
  }

  // 2. サイトの機能をテスト
  const features = {
    supportsFetch: await testFetchSupport(siteInfo.searchUrl || siteInfo.mainUrl),
    requiresJS: await testJSRequirement(siteInfo.searchUrl || siteInfo.mainUrl),
    hasCaptcha: await testCaptcha(siteInfo.searchUrl || siteInfo.mainUrl),
  }

  return {
    ...siteInfo,
    features,
  }
}

// ページの有効性チェック
function isValidPage(snapshot: any): boolean {
  // 1. ステータスコードチェック
  if (snapshot.status !== 200) return false

  // 2. コンテンツチェック
  if (!snapshot.content || snapshot.content.length < 100) return false

  // 3. エラーページチェック
  const errorPatterns = [
    '404',
    'not found',
    'エラー',
    'ページが見つかりません',
    'アクセスできません',
  ]

  return !errorPatterns.some((pattern) =>
    snapshot.content.toLowerCase().includes(pattern.toLowerCase()),
  )
}

// 検索フォームの特定
function findSearchForm(snapshot: any) {
  // 検索フォームの特徴を持つ要素を探す
  const searchPatterns = [
    { type: 'input', attr: { type: 'search' } },
    { type: 'input', attr: { name: 'q' } },
    { type: 'input', attr: { name: 'query' } },
    { type: 'input', attr: { name: 'keyword' } },
    { type: 'input', attr: { placeholder: /検索|search/i } },
  ]

  // スナップショットから要素を探す実装
  // ...
}

// 検索URLの抽出
function extractSearchUrl(logs: any[]): string | null {
  const searchPatterns = [/search/i, /query/i, /\?q=/, /\?keyword=/]

  const searchLog = logs.find((log) => {
    const url = log.request?.url
    return url && searchPatterns.some((pattern) => pattern.test(url))
  })

  return searchLog?.request?.url || null
}

// メイン処理フロー
async function initializeSiteCrawler(siteName: string) {
  try {
    // 1. サイト解析（必須）
    const siteInfo = await analyzeSite(siteName)

    // 2. 解析結果の検証
    validateSiteInfo(siteInfo)

    // 3. 次のフェーズに進む準備
    return {
      siteInfo,
      ready: true,
    }
  } catch (e) {
    console.error('サイト解析に失敗しました:', e)
    return {
      error: e.message,
      ready: false,
    }
  }
}

// サイト情報の検証
function validateSiteInfo(siteInfo: SiteInfo) {
  const required = ['mainUrl', 'searchUrl', 'features']
  const missing = required.filter((key) => !siteInfo[key])

  if (missing.length > 0) {
    throw new Error(`必須情報が不足しています: ${missing.join(', ')}`)
  }
}
```

## 1. サイト解析フェーズ

**重要: このフェーズは、サイト特定フェーズが成功し、`siteInfo.ready === true` の場合のみ実行してください。**

### 1. サイトURLの特定と基本構造の確認

```typescript
// 1. サイトにアクセス
await mcp_playwright_browser_navigate({ url: targetSite })
await mcp_playwright_browser_snapshot()

// 2. 検索フォームの特定とベース動作確認
const testQueries = ['ワンピース', 'ドラゴンボール', 'ガンダム', 'NARUTO', '鬼滅の刃']

const searchResults = []

for (const query of testQueries) {
  // 検索実行
  await mcp_playwright_browser_type({
    element: '検索フォーム',
    ref: '検索フォームのref',
    text: query,
    submit: true,
  })

  // 結果ページのスナップショット
  await mcp_playwright_browser_snapshot()

  // ネットワークログの取得
  const networkLogs = await mcp_browser_tools_mcp_getNetworkLogs()

  // 検索URLの抽出
  const searchUrl = networkLogs.find(
    (log) =>
      log.request.url.includes('search') ||
      log.request.url.includes('?') ||
      log.request.url.includes('query'),
  )?.request.url

  searchResults.push({
    query,
    url: searchUrl,
    // 結果ページの状態も保存
  })

  // フィルターとソートオプションの確認
  await mcp_playwright_browser_snapshot()

  // 戻ってホームに
  await mcp_playwright_browser_navigate({ url: targetSite })
}

// 3. 高度な検索パターンのテスト
const advancedQueries = [
  '新品 ワンピース フィギュア',
  'ドラゴンボール 在庫あり',
  'ガンダム プラモデル 1000円以下',
  'NARUTO フィギュア 新作',
  '鬼滅の刃 限定品',
]

// 高度な検索パターンのテスト実行
for (const query of advancedQueries) {
  // 検索実行
  await mcp_playwright_browser_type({
    element: '検索フォーム',
    ref: '検索フォームのref',
    text: query,
    submit: true,
  })

  // 結果ページのスナップショット
  await mcp_playwright_browser_snapshot()

  // ネットワークログの取得と解析
  const networkLogs = await mcp_browser_tools_mcp_getNetworkLogs()
  const searchUrl = networkLogs.find(
    (log) =>
      log.request.url.includes('search') ||
      log.request.url.includes('?') ||
      log.request.url.includes('query'),
  )?.request.url

  // 検索結果の解析
  searchResults.push({
    query,
    url: searchUrl,
    type: 'advanced',
    // 高度な検索パターンの特徴を記録
    features: {
      hasCondition: query.includes('新品'),
      hasPrice: query.includes('円'),
      hasStock: query.includes('在庫'),
      hasCategory: query.includes('フィギュア') || query.includes('プラモデル'),
      hasStatus: query.includes('新作') || query.includes('限定'),
    },
  })

  // フィルターとソートオプションの確認
  await mcp_playwright_browser_snapshot()

  // 戻ってホームに
  await mcp_playwright_browser_navigate({ url: targetSite })
}

// 4. URLパターンの分析
const urlPatterns = searchResults.map((result) => {
  const url = new URL(result.url)
  return {
    baseUrl: `${url.protocol}//${url.host}${url.pathname}`,
    params: Object.fromEntries(url.searchParams.entries()),
    query: result.query,
  }
})

// 5. 共通パターンの特定
const commonPattern = analyzeUrlPatterns(urlPatterns)
```

### 2. 検索URLの詳細解析

```typescript
// 1. ベースURLの検証
async function validateBaseUrl(baseUrl, testQueries) {
  const results = []

  for (const query of testQueries) {
    // 直接URLを構築してアクセス
    const testUrl = `${baseUrl}?ky=${encodeURIComponent(query)}`
    await mcp_playwright_browser_navigate({ url: testUrl })

    // 結果の検証
    await mcp_playwright_browser_snapshot()
    const isValid =
      /* 結果ページの妥当性チェック */

      results.push({
        query,
        url: testUrl,
        isValid,
      })
  }

  return results
}

// 2. パラメータの検証
async function validateParameters(baseUrl, parameters) {
  const results = []

  // 各パラメータの組み合わせをテスト
  for (const param of parameters) {
    const testUrl = `${baseUrl}?${param.key}=${param.value}&ky=テスト`
    await mcp_playwright_browser_navigate({ url: testUrl })

    // 結果の検証
    await mcp_playwright_browser_snapshot()
    const isValid =
      /* パラメータの効果を検証 */

      results.push({
        parameter: param,
        url: testUrl,
        isValid,
      })
  }

  return results
}
```

出力形式：

```json
{
  "baseUrl": "検索のベースURL（パスまで）",
  "searchParameters": {
    "必須パラメータ": {
      "ky": "検索キーワード（URLエンコード必須）",
      "t": "検索タイプ"
    },
    "オプションパラメータ": {
      "パラメータ名": {
        "description": "パラメータの説明",
        "values": ["可能な値のリスト"],
        "defaultValue": "デフォルト値",
        "encoding": "必要なエンコーディング方式"
      }
    }
  },
  "queryValidation": {
    "encoding": "URLエンコーディングの要否",
    "maxLength": "最大長制限",
    "specialCharacters": "特殊文字の扱い",
    "successPatterns": ["成功したクエリパターン"],
    "failurePatterns": ["失敗したクエリパターン"]
  },
  "htmlStructure": {
    "productList": "セレクタ",
    "productItem": {
      "title": "セレクタ",
      "price": "セレクタ",
      "status": "セレクタ"
    }
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
    const siteInfo = context.getSharedData('siteInfo')
    const keyword = context.getStepResult(buildQuery{サイト名}Step)?.keyword
    const options = context.getStepResult(buildQuery{サイト名}Step)?.options

    if (!keyword || !options) {
      throw new Error('Failed to get keyword or options')
    }

    try {
      // 1. 検索URLの構築
      const searchUrl = buildSearchUrl(siteInfo.searchUrl, keyword, options)

      // 2. 段階的なクローリング
      if (siteInfo.features.supportsFetch) {
        // Fetchを使用した軽量クローリング
        return await fetchBasedCrawling(searchUrl)
      } else if (!siteInfo.features.requiresJS) {
        // Cheerioを使用した静的HTML解析
        return await cheerioBasedCrawling(searchUrl)
      } else {
        // Playwrightを使用した動的クローリング
        return await playwrightBasedCrawling(searchUrl)
      }
    } catch (e) {
      console.error('Error in page crawler:', e)
      return { products: [] }
    }
  }
})

// Fetchベースのクローリング（最軽量）
async function fetchBasedCrawling(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 ...',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  })
  const html = await response.text()
  return parseProductsWithCheerio(html)
}

// Cheerioベースのクローリング（軽量）
async function cheerioBasedCrawling(url: string) {
  // axiosやgot等の軽量HTTPクライアントを使用
  const response = await axios.get(url)
  return parseProductsWithCheerio(response.data)
}

// Playwrightベースのクローリング（重量級、最終手段）
async function playwrightBasedCrawling(url: string) {
  await mcp_playwright_browser_navigate({ url })
  const snapshot = await mcp_playwright_browser_snapshot()
  return parseProductsFromSnapshot(snapshot)
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

## 4. 検索クエリテストスイート

```typescript
// クエリビルダーの品質検証用テストスイート
const testQueries = [
  {
    input: 'ワンピース フィギュア 新品',
    expected: {
      keyword: 'ワンピース フィギュア',
      options: {
        condition: 'new',
      },
    },
  },
  {
    input: 'ドラゴンボール 在庫あり 1000円以下',
    expected: {
      keyword: 'ドラゴンボール',
      options: {
        inStock: true,
        maxPrice: '1000',
      },
    },
  },
  // ... 他のテストケース
]

async function validateQueryBuilder(builder, tests) {
  const results = []

  for (const test of tests) {
    const result = await builder.execute(test.input)
    const validation = compareResults(result, test.expected)

    results.push({
      input: test.input,
      expected: test.expected,
      actual: result,
      isValid: validation.isValid,
      differences: validation.differences,
    })
  }

  return results
}
```

## 5. 自動改善プロセス

```typescript
async function improveQueryBuilder(builder, failedTests) {
  // 1. 失敗パターンの分析
  const patterns = analyzeFailurePatterns(failedTests)

  // 2. LLMへのフィードバック
  const feedback = generateLLMFeedback(patterns)

  // 3. ビルダーの更新
  const updatedInstructions = await updateBuilderInstructions(builder.instructions, feedback)

  // 4. 再テスト
  const newBuilder = new Agent({
    ...builder,
    instructions: updatedInstructions,
  })

  return newBuilder
}
```

注意事項：

1. 各テストケースで必ずネットワークログを確認し、実際のリクエストURLを検証する
2. 検索結果の件数や内容の妥当性も確認する
3. エラーケース（無効なクエリ、特殊文字など）も必ずテストする
4. レート制限に注意し、テスト間隔を適切に設定する

# ページクローラーステップの実装ガイド

## 概要

ページクローラーステップは、構築された検索URLを使用して実際にECサイトから商品情報を収集し、統一されたフォーマットに変換する役割を担います。

## 基本実装手順

### 1. ステップの定義

```typescript
const pageCrawlerStep = new Step({
  id: 'pageCrawler{サイト名}Step',
  inputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  outputSchema: z.object({
    products: z.array(productSchema),
  }),
  execute: async ({ context }) => {
    // 実装
  },
})
```

## 主要な処理フロー

### 1. 検索URLの構築と初期ページの取得

```typescript
// 検索URLの構築
const baseUrl = 'https://example.com/search'
const searchParams = new URLSearchParams()
searchParams.append('keyword', keyword)
Object.entries(options).forEach(([key, value]) => {
  searchParams.append(key, value)
})
const initialUrl = `${baseUrl}?${searchParams.toString()}`

// 初期ページの取得
const response = await fetch(initialUrl, {
  headers: {
    'User-Agent': '適切なUser-Agent',
    // その他必要なヘッダー
  },
})
```

### 2. ページネーション処理

```typescript
// 総商品数と総ページ数の取得
const totalItems = extractTotalItemCount(html)
const maxPage = Math.min(Math.ceil(totalItems / itemsPerPage), maxPageLimit)

// 全ページのURL生成
const urls = Array.from({ length: maxPage }, (_, i) => {
  const pageParams = new URLSearchParams(searchParams)
  pageParams.set('page', (i + 1).toString())
  return `${baseUrl}?${pageParams.toString()}`
})
```

### 3. 並行処理とレート制限

```typescript
// 並行処理の制御
await Promise.all(
  urls.map(async (url, index) => {
    // レート制限の実装
    await new Promise((resolve) => setTimeout(resolve, index * 500))

    try {
      const response = await fetch(url, {
        headers: {
          /* ... */
        },
        signal: timeoutController.signal,
      })
      // ページの処理
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error)
      return []
    }
  }),
)
```

### 4. HTML解析と商品データの抽出

```typescript
const mapHtmlToProducts = (html: string): ProductEntity[] => {
  const $ = cheerio.load(html)
  const products: ProductEntity[] = []

  $('.product-item').each((_, element) => {
    try {
      const $item = $(element)

      // 必要な情報の抽出
      const title = $item.find('.title').text().trim()
      const price = parsePrice($item.find('.price').text())
      const status = mapStockStatus($item.find('.status').text())

      // ProductEntityの作成
      products.push({
        uniqueKey: generateUniqueKey(),
        title: { ja: title, en: title },
        price,
        // その他の必要なフィールド
      })
    } catch (error) {
      console.error('Error parsing item:', error)
    }
  })

  return products
}
```

### 5. 進捗状況の管理

```typescript
// プロンプトロックを使用した進捗状況の保存
let lockAcquired = false
try {
  lockAcquired = promptProductSaver.acquireLock(promptUniqueKey)
  if (lockAcquired) {
    const isPartial = currentPage < totalPages
    await promptProductSaver.saveProducts(promptUniqueKey, pageProducts, 'shopName', isPartial)
  }
} finally {
  if (lockAcquired) {
    promptProductSaver.releaseLock(promptUniqueKey)
  }
}
```

## 実装のポイント

### 1. エラーハンドリング

- ネットワークエラーの処理
- タイムアウト設定
- リトライロジック
- 不完全なHTMLの処理

### 2. パフォーマンス最適化

- 適切な並行処理数の設定
- メモリ使用量の管理
- レート制限の実装
- キャッシュの活用

### 3. データ品質の確保

- 必須フィールドの検証
- データのクリーニング
- 重複排除
- 文字エンコーディングの処理

### 4. サイト固有の対応

- CAPTCHAの検出と処理
- JavaScriptレンダリングの必要性の判断
- サイト固有のレート制限への対応
- エラーページの検出

### 5. デバッグとモニタリング

- 詳細なログ出力
- デバッグ用HTMLの保存
- パフォーマンスメトリクスの収集
- エラー率の監視

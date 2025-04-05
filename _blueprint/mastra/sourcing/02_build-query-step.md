# クエリビルダーステップの実装ガイド

## 概要

クエリビルダーステップは、ユーザーの検索意図を特定のECサイトの検索パラメータに変換する役割を担います。

## 基本実装手順

### 1. ステップの定義

```typescript
const buildQueryStep = new Step({
  id: 'buildQuery{サイト名}Step',
  inputSchema: z.object({
    translatedKeyword: z.string(),
  }),
  outputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  execute: async ({ context }) => {
    // 実装
  },
})
```

### 2. LLMエージェントの定義

```typescript
const buildQueryAgent = new Agent({
  name: '{サイト名}-query-builder',
  model: openai('gpt-4o-mini'),
  instructions: `
    あなたは{サイト名}の検索クエリを構築するアシスタントです。
    ユーザーの入力から検索キーワードとオプションを抽出し、適切な形式に整形してください。
    
    出力形式:
    {
      "keyword": "検索キーワード",
      "options": {
        // サイト固有のURLパラメータ
      }
    }
    
    // サイト固有のパラメータ仕様を記述
  `,
})
```

## 実装のポイント

### 1. サイト固有のパラメータマッピング

- カテゴリー
- 商品状態（新品/中古）
- 在庫状態
- 価格範囲
- ソート順
- その他のフィルター

### 2. キーワード処理

- 検索に関係ない単語（在庫、価格、表示順など）の除外
- 必要に応じたエンコード処理
- マルチバイト文字への対応

### 3. オプション変換

- ユーザーの自然言語入力をURLパラメータに変換
- デフォルト値の設定
- パラメータの優先順位付け

### 4. エラーハンドリング

- 必須パラメータの欠落チェック
- パラメータ値の検証
- 不正な組み合わせの防止

## 実装例

```typescript
execute: async ({ context }) => {
  // 前のステップから翻訳されたキーワードを取得
  const translatedResult = context.getStepResult(translateStep)
  const translatedKeyword = translatedResult?.translatedKeyword

  if (!translatedKeyword) throw new Error('Translated keyword is required')

  // LLMにクエリ構築を依頼
  const response = await buildQueryAgent.stream([
    {
      role: 'user',
      content: translatedKeyword,
    },
  ])

  // レスポンスの処理
  let result = ''
  for await (const chunk of response.textStream) {
    result += chunk
  }

  // 結果のパース
  try {
    const parsedResult = JSON.parse(result)
    return {
      keyword: parsedResult.keyword,
      options: parsedResult.options || {},
    }
  } catch (e) {
    throw new Error('Failed to parse agent response')
  }
}
```

# サーバー定数のボイラープレート

## 目的

このファイルは、サーバーサイドアプリケーション全体で使用される定数を定義します。
環境変数や設定値などの静的な値を一元管理することで、
コードの一貫性と保守性を向上させます。

## 配置場所

`server/server-const/{name}.server-const.ts`

## ルール

1. ファイル名は `{name}.server-const.ts` とする（例: `application.server-const.ts`, `api.server-const.ts`）
2. 定数名はキャメルケースで定義する（例: `applicationServerConst`, `apiServerConst`）
3. 環境変数は `process.env` から取得する
4. 必須の環境変数には非nullアサーション演算子（`!`）を使用する
5. オプションの環境変数にはデフォルト値を設定する
6. `as const` を使用して型を厳密にする
7. 関連する定数はグループ化する

## 実装例

```typescript
export const applicationServerConst = {
  // アプリケーション設定
  app: {
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiVersion: 'v1',
  },

  // データベース設定
  database: {
    url: process.env.DATABASE_URL!,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    timeout: parseInt(process.env.DB_TIMEOUT || '30000', 10),
  },

  // 外部APIの設定
  externalApis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2048', 10),
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY!,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    },
  },

  // 認証設定
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    tokenExpiration: process.env.TOKEN_EXPIRATION || '1d',
  },
} as const
```

## 使用例

```typescript
// server/server-const/application.server-const.ts
export const applicationServerConst = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
} as const
```

## 使用方法

```typescript
import { applicationServerConst } from 'server/server-const/application.server-const'

// OpenAI APIの使用
const openaiClient = new OpenAI({
  apiKey: applicationServerConst.openai.apiKey,
})

// Gemini APIの使用（オプション）
if (applicationServerConst.gemini.apiKey) {
  const geminiClient = new Gemini({
    apiKey: applicationServerConst.gemini.apiKey,
  })
}
```

## 注意点

1. **環境変数の検証**

   - アプリケーション起動時に必須の環境変数が設定されているか検証することを推奨
   - 例:
     ```typescript
     if (!process.env.OPENAI_API_KEY) {
       throw new Error('OPENAI_API_KEY is required')
     }
     ```

2. **型の厳密さ**

   - `as const` を使用することで、オブジェクトのプロパティが読み取り専用になり、型が厳密になる
   - 必要に応じて型定義を追加する

3. **機密情報の扱い**

   - 機密情報（APIキー、パスワードなど）は環境変数から取得し、ハードコードしない
   - 環境変数は `.env` ファイルで管理し、バージョン管理システムには含めない
   - 本番環境では適切なシークレット管理サービスの使用を検討する

4. **命名規則の一貫性**
   - プロジェクト全体で一貫した命名規則を使用する
   - 他の開発者が理解しやすい名前を選ぶ

# フロントエンド定数のボイラープレート

## 目的

このファイルは、フロントエンドアプリケーション全体で使用される定数を定義します。
アプリケーションの設定値やURLなどの静的な値を一元管理することで、
コードの一貫性と保守性を向上させます。

## 配置場所

`front/consts/{name}.front-const.ts`

## ルール

1. ファイル名は `{name}.front-const.ts` とする（例: `application-properties.front-const.ts`, `application-url.front-const.ts`）
2. 定数名はパスカルケースで定義する（例: `ApplicationProperties`, `ApplicationUrls`）
3. 定数のプロパティ名は用途に応じて適切な命名規則を使用する
   - 設定値: キャメルケース（例: `apiVersion`, `maxRetryCount`）
   - 固定値/列挙値: スネークケースの大文字（例: `API_VERSION`, `MAX_RETRY_COUNT`）
4. 必要に応じて `as const` を使用して型を厳密にする
5. 関連する定数はグループ化する
6. 環境変数に依存する値は含めない（サーバー側の定数で管理する）

## 実装例

```typescript
export const ApplicationProperties = {
  NAME: 'アプリケーション名',
  VERSION: '1.0.0',
  ENVIRONMENT: 'production',
  FEATURES: {
    DARK_MODE: true,
    NOTIFICATIONS: true,
    ANALYTICS: false,
  },
} as const
```

```typescript
export const ApplicationUrls = {
  // 外部URL
  corporateUrl: 'https://example.com',
  docsUrl: 'https://docs.example.com',
  apiBaseUrl: 'https://api.example.com',

  // 内部ルート
  routes: {
    home: '/',
    dashboard: '/dashboard',
    profile: '/profile',
    settings: '/settings',
  },

  // API エンドポイント
  api: {
    users: '/api/users',
    products: '/api/products',
    orders: '/api/orders',
  },
} as const
```

## 使用例

```typescript
// front/consts/application-properties.front-const.ts
export const ApplicationProperties = {
  NAME: 'Next.js 15 Hono Template',
  VERSION: '1.0.0',
}
```

```typescript
// front/consts/application-url.front-const.ts
export const ApplicationUrls = {
  corporateUrl: 'https://example.com',
}
```

## 使用方法

```typescript
import { ApplicationProperties } from 'front/consts/application-properties.front-const'
import { ApplicationUrls } from 'front/consts/application-url.front-const'

// 定数の使用
console.log(`アプリケーション名: ${ApplicationProperties.NAME}`)
console.log(`バージョン: ${ApplicationProperties.VERSION}`)

// URLの使用
const corporateLink = document.createElement('a')
corporateLink.href = ApplicationUrls.corporateUrl
corporateLink.textContent = '企業サイト'
document.body.appendChild(corporateLink)
```

## 注意点

1. **定数の変更頻度**

   - 頻繁に変更される値は定数として定義しない
   - 設定値として別の仕組み（環境変数など）で管理することを検討する

2. **型の厳密さ**

   - `as const` を使用することで、オブジェクトのプロパティが読み取り専用になり、型が厳密になる
   - 必要に応じて型定義を追加する

3. **命名規則の一貫性**
   - プロジェクト全体で一貫した命名規則を使用する
   - 他の開発者が理解しやすい名前を選ぶ

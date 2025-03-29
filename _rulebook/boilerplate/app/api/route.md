# APIルートのボイラープレート

## 目的

このファイルは、Next.jsのApp Routerを使用してAPIエンドポイントを定義します。
Honoを使用してルーティングを行い、サーバーサイドのロジックを実行します。

## 配置場所

`app/api/[...route]/route.ts`

## ルール

1. ファイル名は `route.ts` とし、`app/api/[...route]/` ディレクトリに配置する
2. サーバーのルーターからエンドポイントをインポートする
3. Honoインスタンスを作成し、ベースパスを設定する
4. ルートを定義する
5. Vercelのハンドラーをエクスポートする
6. 必要なHTTPメソッド（GET, POST, PUT, DELETE）のみをエクスポートする

## 実装例

```typescript
import { getResource } from '@/server/router/resources/show'
import { createResource } from '@/server/router/resources/create'
import { updateResource } from '@/server/router/resources/update'
import { deleteResource } from '@/server/router/resources/delete'
import { listResources } from '@/server/router/resources/index'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

// Honoインスタンスを作成し、ベースパスを設定
const hono = new Hono().basePath('/api')

// ルートを定義
hono.route('/', getResource)
hono.route('/', createResource)
hono.route('/', updateResource)
hono.route('/', deleteResource)
hono.route('/', listResources)

// 必要なHTTPメソッドのハンドラーをエクスポート
export const GET = handle(hono)
export const POST = handle(hono)
export const PUT = handle(hono)
export const DELETE = handle(hono)
```

## 使用例

```typescript
// app/api/[...route]/route.ts
import { getPrompt } from '@/server/router/prompts/show'
import { createUser } from '@/server/router/users/create'
import { createUserPrompt } from '@/server/router/users/prompts/create'
import { getUser } from '@/server/router/users/show'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const hono = new Hono().basePath('/api')

hono.route('/', getUser)
hono.route('/', createUser)
hono.route('/', getPrompt)
hono.route('/', createUserPrompt)

export const GET = handle(hono)
export const POST = handle(hono)
```

## 注意点

1. **ルートの衝突に注意**

   - 同じパスに対して複数のハンドラーを定義すると、最初に一致したものが使用されます
   - パスパラメータやクエリパラメータを使用して、ルートを区別することができます

2. **エクスポートするHTTPメソッド**

   - 使用するHTTPメソッドのみをエクスポートしてください
   - 例えば、GETとPOSTのみを使用する場合は、それらのみをエクスポートします

3. **エラーハンドリング**

   - グローバルなエラーハンドリングを設定することができます

   ```typescript
   hono.onError((err, c) => {
     console.error(`${c.req.method} ${c.req.url}`, err)
     return c.json({ error: 'Internal Server Error' }, 500)
   })
   ```

4. **ミドルウェア**

   - 認証やロギングなどのミドルウェアを追加することができます

   ```typescript
   import { logger } from '@/server/server-middleware/logger'
   import { auth } from '@/server/server-middleware/auth'

   const hono = new Hono().basePath('/api')

   // グローバルミドルウェアを追加
   hono.use('*', logger())

   // 特定のパスに対してミドルウェアを追加
   hono.use('/users/*', auth())
   ```

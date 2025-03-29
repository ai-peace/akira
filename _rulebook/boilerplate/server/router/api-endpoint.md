# APIエンドポイントのボイラープレート

## 目的

このファイルは、特定のリソースに対するAPIエンドポイントを定義します。
Honoを使用してHTTPリクエストを処理し、適切なレスポンスを返します。

## 配置場所

`server/router/{resource-name}/{action}.ts`

## ルール

1. ファイル名はHTTPメソッドに対応する（create.ts, show.ts, update.ts, delete.ts, index.ts）
2. スキーマフォルダから入力検証スキーマをインポートする
3. 厳密なエラーハンドリングを実装する
   - `try/catch` ブロックを使用する
   - エラーをログに記録する
   - 適切なエラーコードとメッセージを返す
4. 型安全性を確保する
   - レスポンス型を定義する（`HcApiResponseType<T>`）
   - ルートの型をエクスポートする（`export type {Action}{ResourceName}Route = typeof route`）
5. ビジネスロジックは最小限に抑え、ユースケースに委譲する

## 実装例

```typescript
import { {DomainName}Entity } from '@/common/domains/{domain-name}.entity'
import { createHcApiError, hcApiErrorCodes, HcApiResponseType } from '@/common/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma-service.util'
import { {domainName}Mapper } from '@/server/server-mappers/{domain-name}/index.mapper'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { {domainName}CreateSchema } from './schema/create.schema'

// Honoインスタンスの作成
export const create{DomainName} = new Hono()

// ルートの定義
const route = create{DomainName}.post('/{domainName}s', zValidator('json', {domainName}CreateSchema), async (c) => {
  try {
    // リクエストボディの取得
    const data = c.req.valid('json')

    // データベース操作
    const created{DomainName} = await prisma.{domainName}.create({
      data: {
        // データの設定...
        name: data.name,
        // 他のフィールド...
      },
    })

    // エンティティへの変換
    const {domainName}Entity = {domainName}Mapper.toDomain(created{DomainName})

    // 成功レスポンスの返却
    return c.json<HcApiResponseType<{DomainName}Entity>>(
      {
        data: {domainName}Entity,
      },
      201,
    )
  } catch (error) {
    // エラーのログ記録
    console.error('Error creating {domainName}:', error)

    // エラーレスポンスの返却
    return c.json<HcApiResponseType<null>>(
      {
        error: createHcApiError(hcApiErrorCodes.SERVER_ERROR),
      },
      500,
    )
  }
})

// ルートの型をエクスポート
export type Create{DomainName}Route = typeof route
```

## 使用例

```typescript
// server/router/users/create.ts
import { UserEntity } from '@/common/domains/user.entity'
import { createHcApiError, hcApiErrorCodes, HcApiResponseType } from '@/common/errors/hc-api.error'
import { prisma } from '@/server/server-lib/prisma-service.util'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { userMapper } from '@/server/server-mappers/users/index.mapper'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createUserSchema } from './schema/create.schema'

export const createUser = new Hono()

const route = createUser.post('/users', zValidator('json', createUserSchema), async (c) => {
  try {
    const data = c.req.valid('json')

    // For dummy
    const user = await prisma.user.create({
      data: {
        name: data.name,
        uniqueKey: generateUniqueKey(),
        authKey: generateUniqueKey(),
        eoaAddress: generateUniqueKey(),
        loginMethod: 'EMAIL',
      },
    })

    const userEntity = userMapper.toDomain(user)

    return c.json<HcApiResponseType<UserEntity>>(
      {
        data: userEntity,
      },
      201,
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return c.json<HcApiResponseType<null>>(
      {
        error: createHcApiError(hcApiErrorCodes.SERVER_ERROR),
      },
      500,
    )
  }
})

export type CreateUserRoute = typeof route
```

## ルーティングの設定例

```typescript
// app/api/[...route]/route.ts
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

import { createUser } from '@/server/router/users/create'
import { getUser } from '@/server/router/users/show'
// 他のルート...

const app = new Hono()

// ルートの登録
app.route('/', createUser)
app.route('/', getUser)
// 他のルート...

// HTTPメソッドのエクスポート
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
```

## 注意点

1. **レスポンス型の定義**

   - すべてのレスポンスは `HcApiResponseType<T>` 型を使用する
   - 成功レスポンスは `{ data: T }` の形式で返す
   - エラーレスポンスは `{ error: HcApiErrorType }` の形式で返す

2. **エラーハンドリング**

   - すべての操作は `try/catch` ブロックで囲む
   - エラーは適切にログに記録する
   - エラーコードは `hcApiErrorCodes` から適切なものを選択する
   - `createHcApiError` 関数を使用してエラーオブジェクトを作成する

3. **型のエクスポート**

   - ルートの型を `export type {Action}{ResourceName}Route = typeof route` の形式でエクスポートする
   - これにより、`server/router/types.ts` でAPIルートの型を集約できる

4. **ステータスコード**
   - 適切なHTTPステータスコードを設定する
   - 作成成功: 201
   - 取得/更新成功: 200
   - バリデーションエラー: 400
   - 認証エラー: 401
   - 認可エラー: 403
   - リソース未検出: 404
   - サーバーエラー: 500

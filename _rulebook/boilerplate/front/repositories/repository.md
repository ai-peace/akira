# リポジトリのボイラープレート

## 目的

このファイルは、特定のドメインエンティティに対するデータアクセス操作を
カプセル化するリポジトリを定義します。リポジトリはAPIクライアントを使用して
サーバーと通信し、エンティティのCRUD操作を提供します。

## 配置場所

`front/repositories/{domain-name}.repository.ts`

## ルール

1. ファイル名は `{domain-name}.repository.ts` とする
2. 対応するエンティティをインポートする
3. APIクライアントを使用してサーバーと通信する
4. 各メソッドにJSDocコメントを含める
5. 厳密なエラーハンドリングを実装する
   - `HcApiError` を使用して型付きのエラーを投げる
   - エラーコードを適切に設定する
6. 厳密な型チェックを実装する
   - レスポンスの構造を検証する
   - 必要に応じて型変換を行う（例: 日付型への変換）
7. 各メソッドを個別の関数として定義し、最後にオブジェクトとしてまとめてエクスポートする

## 実装例

```typescript
import { {DomainName}Entity } from 'common/domains/{domain-name}.entity'
import { HcApiError } from 'common/errors/frontend.error'
import { hcApiErrorCodes } from 'common/errors/hc-api.error'
import { hcClient } from 'front/api-client/hc.api-client'
import { InferRequestType } from 'hono'

const client = hcClient()

// リクエスト型の定義
export type Get{DomainName}Request = InferRequestType<(typeof client.{domainName}s)[':uniqueKey']['$get']>
export type Create{DomainName}Request = InferRequestType<typeof client.{domainName}s.$post>

/**
 * {DomainName}を取得する
 * @param uniqueKey 取得する{DomainName}のユニークキー
 * @returns {DomainName}エンティティ
 * @throws HcApiError APIエラーが発生した場合
 */
const get = async (uniqueKey: string): Promise<{DomainName}Entity> => {
  const response = await client.{domainName}s[':uniqueKey'].$get({
    param: { uniqueKey },
  })
  const json = await response.json()

  // レスポンスの構造を検証
  if (!('data' in json) || !json.data) throw new Error('Failed to get {domainName}')

  // 成功レスポンスの処理
  if (response.ok && 'data' in json && json.data) {
    return {
      ...json.data,
      // 日付型への変換
      createdAt: new Date(json.data.createdAt),
      updatedAt: new Date(json.data.updatedAt),
      // オプショナルフィールドの変換
      someDate: json.data.someDate ? new Date(json.data.someDate) : undefined,
    }
  }

  // エラーレスポンスの処理
  if ('error' in json && json.error) {
    const error = json.error as { code?: string; message?: string }
    throw new HcApiError(
      (error.code as keyof typeof hcApiErrorCodes) ?? hcApiErrorCodes.UNKNOWN_ERROR,
      error.message ?? '',
      json.error,
    )
  }

  // 不明なエラーの処理
  throw new HcApiError(hcApiErrorCodes.UNKNOWN_ERROR, 'Unknown error', { error: 'Unknown error' })
}

/**
 * 新しい{DomainName}を作成する
 * @param input 作成する{DomainName}のデータ
 * @returns 作成された{DomainName}エンティティ
 * @throws HcApiError APIエラーが発生した場合
 */
const create = async (input: Create{DomainName}Request['json']): Promise<{DomainName}Entity> => {
  const response = await client.{domainName}s.$post({ json: input })
  const json = await response.json()

  // レスポンスの構造を検証
  if (!('data' in json) || !json.data) throw new Error('Failed to create {domainName}')

  // 成功レスポンスの処理
  if (response.ok && 'data' in json && json.data) {
    return {
      ...json.data,
      // 日付型への変換
      createdAt: new Date(json.data.createdAt),
      updatedAt: new Date(json.data.updatedAt),
      // オプショナルフィールドの変換
      someDate: json.data.someDate ? new Date(json.data.someDate) : undefined,
    }
  }

  // エラーレスポンスの処理
  if ('error' in json && json.error) {
    const error = json.error as { code?: string; message?: string }
    throw new HcApiError(
      (error.code as keyof typeof hcApiErrorCodes) ?? hcApiErrorCodes.UNKNOWN_ERROR,
      error.message ?? '',
      json.error,
    )
  }

  // 不明なエラーの処理
  throw new HcApiError(hcApiErrorCodes.UNKNOWN_ERROR, 'Unknown error', { error: 'Unknown error' })
}

// リポジトリをエクスポート
export const {domainName}Repository = { get, create }
```

## 使用例

```typescript
// front/repositories/user.repository.ts
import { UserEntity } from 'common/domains/user.entity'
import { HcApiError } from 'common/errors/frontend.error'
import { hcApiErrorCodes } from 'common/errors/hc-api.error'
import { hcClient } from 'front/api-client/hc.api-client'
import { InferRequestType } from 'hono'

const client = hcClient()

export type GetUserRequest = InferRequestType<(typeof client.users)[':uniqueKey']['$get']>
export type CreateUserRequest = InferRequestType<typeof client.users.$post>

const get = async (uniqueKey: string): Promise<UserEntity> => {
  const response = await client.users[':uniqueKey'].$get({
    param: { uniqueKey },
  })
  const json = await response.json()

  if (!('data' in json) || !json.data) throw new Error('Failed to get user')

  if (response.ok && 'data' in json && json.data) {
    const userData = json.data
    return {
      uniqueKey: userData.uniqueKey ?? '',
      name: userData.name,
      imageUrl: userData.imageUrl,
      prompts: userData.prompts?.map((prompt) => ({
        ...prompt,
        llmStatusChangeAt: prompt.llmStatusChangeAt
          ? new Date(prompt.llmStatusChangeAt)
          : undefined,
        createdAt: new Date(prompt.createdAt),
        updatedAt: new Date(prompt.updatedAt),
      })),
    }
  }

  if ('error' in json && json.error) {
    const error = json.error as { code?: string; message?: string }
    throw new HcApiError(
      (error.code as keyof typeof hcApiErrorCodes) ?? hcApiErrorCodes.UNKNOWN_ERROR,
      error.message ?? '',
      json.error,
    )
  }

  throw new HcApiError(hcApiErrorCodes.UNKNOWN_ERROR, 'Unknown error', { error: 'Unknown error' })
}

const create = async (input: CreateUserRequest['json']): Promise<UserEntity> => {
  // 実装...
}

export const userRepository = { get, create }
```

## 注意点

1. **エラーハンドリング**

   - すべてのAPIリクエストは適切にエラーハンドリングする
   - エラーコードは `hcApiErrorCodes` から適切なものを選択する
   - エラーメッセージは意味のあるものにする
   - エラーの詳細情報は可能な限り含める

2. **型安全性**

   - `InferRequestType` を使用してリクエスト型を定義する
   - レスポンスの構造を厳密に検証する
   - 日付文字列は `Date` オブジェクトに変換する
   - オプショナルフィールドは適切に処理する

3. **レスポンス処理**

   - レスポンスの構造を検証する前に、`response.json()` を呼び出す
   - `response.ok` と `'data' in json` の両方をチェックする
   - データの存在を確認する（`!json.data`）

4. **関連エンティティの処理**
   - 関連エンティティも適切に変換する
   - 配列の場合は `map` を使用して各要素を変換する

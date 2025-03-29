# エラー処理のボイラープレート

## 目的

このファイルは、アプリケーション全体で一貫したエラー処理を実現するためのエラー型とユーティリティを定義します。
サーバーとクライアント間で統一されたエラー形式を使用することで、エラーハンドリングを簡素化し、
デバッグを容易にします。

## 配置場所

- サーバーエラー定義: `common/errors/hc-api.error.ts`
- クライアントエラー定義: `common/errors/frontend.error.ts`

## ルール

1. エラーコードは列挙型として定義する
2. エラーメッセージはエラーコードに対応して定義する
3. エラーレスポンスの型を定義する
4. エラー作成関数を提供する
5. クライアント側でのエラーハンドリングのためのエラークラスを定義する

## 実装例

### サーバーエラー定義

```typescript
// common/errors/hc-api.error.ts

// レスポンス型
export type HcApiErrorType = {
  code: HcApiErrorCode
  message: string
  details?: Record<string, unknown>
}

export type HcApiResponseType<T> = {
  data?: T
  error?: HcApiErrorType
}

// エラーコード
export type HcApiErrorCode = (typeof hcApiErrorCodes)[keyof typeof hcApiErrorCodes]

export const hcApiErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  // 他のエラーコード...
} as const

// エラーメッセージ
export const hcApiErrorMessages = {
  [hcApiErrorCodes.UNAUTHORIZED]: {
    en: () => 'Unauthorized',
  },
  [hcApiErrorCodes.FORBIDDEN]: {
    en: () => 'Forbidden',
  },
  [hcApiErrorCodes.NOT_FOUND]: {
    en: (payload?: Record<string, unknown>) => `Not found: ${payload?.resource}`,
  },
  [hcApiErrorCodes.VALIDATION_ERROR]: {
    en: () => 'Validation error',
  },
  [hcApiErrorCodes.SERVER_ERROR]: {
    en: () => 'Server error',
  },
  [hcApiErrorCodes.UNKNOWN_ERROR]: {
    en: () => 'Unknown error',
  },
  // 他のエラーメッセージ...
} as const

// エラー作成関数
export const createHcApiError = (
  code: HcApiErrorCode,
  payload?: Record<string, unknown>,
  details?: Record<string, unknown>,
): HcApiErrorType => {
  return {
    code,
    message: hcApiErrorMessages[code].en(payload),
    details,
  }
}
```

### クライアントエラー定義

```typescript
// common/errors/frontend.error.ts
import { HcApiErrorCode } from './hc-api.error'

// クライアントサイドで利用するサーバーエラー型
export class HcApiError extends Error {
  constructor(
    public readonly code: HcApiErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'HcApiError'
  }
}
```

## 使用例

### サーバー側でのエラー作成

```typescript
// server/router/users/create.ts
import { createHcApiError, hcApiErrorCodes, HcApiResponseType } from '@/common/errors/hc-api.error'
import { Hono } from 'hono'

export const createUser = new Hono()

const route = createUser.post('/users', async (c) => {
  try {
    // 処理...

    // 成功レスポンス
    return c.json<HcApiResponseType<UserEntity>>(
      {
        data: userEntity,
      },
      201,
    )
  } catch (error) {
    console.error('Error creating user:', error)

    // バリデーションエラーの場合
    if (error instanceof z.ZodError) {
      return c.json<HcApiResponseType<null>>(
        {
          error: createHcApiError(
            hcApiErrorCodes.VALIDATION_ERROR,
            {},
            { zodErrors: error.errors },
          ),
        },
        400,
      )
    }

    // その他のエラーの場合
    return c.json<HcApiResponseType<null>>(
      {
        error: createHcApiError(hcApiErrorCodes.SERVER_ERROR),
      },
      500,
    )
  }
})
```

### クライアント側でのエラーハンドリング

```typescript
// front/repositories/user.repository.ts
import { UserEntity } from '@/common/domains/user.entity'
import { HcApiError } from '@/common/errors/frontend.error'
import { hcApiErrorCodes } from '@/common/errors/hc-api.error'
import { hcClient } from '@/front/api-client/hc.api-client'

const get = async (uniqueKey: string): Promise<UserEntity> => {
  try {
    const response = await client.users[':uniqueKey'].$get({
      param: { uniqueKey },
    })
    const json = await response.json()

    // 成功レスポンスの処理
    if (response.ok && 'data' in json && json.data) {
      return {
        // データの変換...
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
  } catch (error) {
    // すでにHcApiErrorの場合はそのままスロー
    if (error instanceof HcApiError) {
      throw error
    }

    // その他のエラーはHcApiErrorに変換
    throw new HcApiError(
      hcApiErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      { originalError: error },
    )
  }
}
```

### コンポーネントでのエラーハンドリング

```typescript
// front/components/04_screens/SUserShowScreen/index.tsx
import { useUser } from '@/front/hooks/resources/useUser'
import { HcApiError } from '@/common/errors/frontend.error'
import { hcApiErrorCodes } from '@/common/errors/hc-api.error'

const SUserShowScreen = ({ uniqueKey }: { uniqueKey: string }) => {
  const { user, userError } = useUser(uniqueKey)

  // エラーハンドリング
  if (userError) {
    if (userError instanceof HcApiError) {
      // エラーコードに基づいた処理
      switch (userError.code) {
        case hcApiErrorCodes.NOT_FOUND:
          return <div>ユーザーが見つかりませんでした</div>
        case hcApiErrorCodes.UNAUTHORIZED:
          return <div>認証が必要です</div>
        case hcApiErrorCodes.FORBIDDEN:
          return <div>アクセス権限がありません</div>
        default:
          return <div>エラーが発生しました: {userError.message}</div>
      }
    }

    // その他のエラー
    return <div>予期しないエラーが発生しました</div>
  }

  // 通常の表示
  return (
    <div>
      {/* ユーザー情報の表示 */}
    </div>
  )
}
```

## 注意点

1. **エラーコードの一貫性**

   - エラーコードは一貫して使用する
   - 新しいエラーコードを追加する場合は、対応するメッセージも追加する
   - エラーコードは意味のある名前にする

2. **エラーメッセージの国際化**

   - エラーメッセージは多言語対応を考慮する
   - 現在は英語のみだが、将来的に他の言語を追加できるようにする

3. **詳細情報の提供**

   - デバッグに役立つ詳細情報を `details` フィールドに含める
   - 機密情報は含めないように注意する

4. **エラーハンドリングの一貫性**
   - すべてのAPIエンドポイントで同じエラーハンドリングパターンを使用する
   - すべてのリポジトリで同じエラーハンドリングパターンを使用する
   - エラーはできるだけ早く捕捉し、適切に変換する

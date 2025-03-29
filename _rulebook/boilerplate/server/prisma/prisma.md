# Prismaのボイラープレート

## 目的

このファイルは、データベースのスキーマ定義とPrismaクライアントの設定を行います。
Prismaを使用してデータベースとのやり取りを型安全に行うための基盤となります。

## 配置場所

- スキーマ定義: `server/prisma/schema.prisma`
- Prismaサービス: `server/server-lib/prisma-service.util.ts`

## ルール

### スキーマ定義のルール

1. モデル名はパスカルケース（例: `User`, `Prompt`）で定義する
2. フィールド名はキャメルケース（例: `uniqueKey`, `createdAt`）で定義する
3. データベースのカラム名はスネークケース（例: `unique_key`, `created_at`）で定義し、`@map` アノテーションを使用する
4. 主キーには `@id` アノテーションを使用する
5. 一意制約には `@@unique` アノテーションを使用する
6. インデックスには `@@index` アノテーションを使用する
7. リレーションは明示的に定義する
8. 作成日時と更新日時のフィールドを含める
9. 論理削除を使用する場合は `deletedAt` フィールドを含める
10. 列挙型は適切に定義する

### Prismaサービスのルール

1. シングルトンパターンを使用してPrismaClientのインスタンスを管理する
2. 接続と切断のメソッドを提供する
3. エラーフォーマットは最小限に設定する
4. ログ設定は環境に応じて適切に設定する

## 実装例

### スキーマ定義の例

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int    @id @default(autoincrement())
  uniqueKey String @map("unique_key") @db.VarChar(255)

  name     String? @db.VarChar(255)
  email    String? @db.VarChar(255)
  imageUrl String? @map("image_url") @db.VarChar(65535)

  deletedAt DateTime? @map("deleted_at") // 論理削除

  updatedAt DateTime @updatedAt @map("updated_at")
  createdAt DateTime @default(now()) @map("created_at")

  items Item[]

  @@unique([uniqueKey])
  @@index([uniqueKey], name: "users_unique_key")
  @@map("users")
}

model Item {
  id        Int    @id @default(autoincrement())
  uniqueKey String @map("unique_key")

  userId Int @map("user_id")

  name        String  @db.VarChar(255)
  description String? @db.Text
  status      Status  @default(ACTIVE)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@unique([uniqueKey])
  @@index([uniqueKey])
  @@map("items")
}

enum Status {
  ACTIVE
  INACTIVE
  ARCHIVED
}
```

### Prismaサービスの例

```typescript
import { PrismaClient } from '@prisma/client'

export class PrismaService extends PrismaClient {
  private static instance: PrismaService

  private constructor() {
    super({
      log: [],
      errorFormat: 'minimal',
    })
  }

  public static getInstance(): PrismaService {
    if (!this.instance) {
      this.instance = new PrismaService()
    }
    return this.instance
  }

  async connect() {
    await this.$connect()
  }

  async disconnect() {
    await this.$disconnect()
  }
}

// シングルトンインスタンスをエクスポート
export const prisma = PrismaService.getInstance()
```

## 使用例

### スキーマ定義の使用例

```prisma
// server/prisma/schema.prisma
model Prompt {
  id        Int    @id @default(autoincrement()) @map("id")
  uniqueKey String @map("unique_key")

  userId Int @map("user_id")

  content String? @map("content") @db.Text

  result     Json?   @map("result")
  resultType String? @map("result_type")

  llmStatus         LlmStatus @default(IDLE) @map("llm_status")
  llmStatusChangeAt DateTime? @default(now()) @map("llm_status_change_at")
  llmError          String?   @map("llm_error") @db.Text

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@unique([uniqueKey])
  @@index([uniqueKey])
  @@map("prompts")
}

enum LlmStatus {
  IDLE
  PROCESSING
  SUCCESS
  FAILED
}
```

### Prismaサービスの使用例

```typescript
// server/server-lib/prisma-service.util.ts
import { PrismaClient } from '@prisma/client'

export class PrismaService extends PrismaClient {
  private static instance: PrismaService

  private constructor() {
    super({
      log: [],
      errorFormat: 'minimal',
    })
  }

  public static getInstance(): PrismaService {
    if (!this.instance) {
      this.instance = new PrismaService()
    }
    return this.instance
  }

  async connect() {
    await this.$connect()
  }

  async disconnect() {
    await this.$disconnect()
  }
}

export const prisma = PrismaService.getInstance()
```

## 注意点

1. **環境変数の管理**

   - データベースURLなどの機密情報は環境変数で管理する
   - `.env` ファイルはバージョン管理システムに含めない
   - `.env.example` ファイルを用意して必要な環境変数を示す

2. **マイグレーション管理**

   - スキーマの変更はマイグレーションとして管理する
   - `prisma migrate dev` コマンドを使用してマイグレーションを作成する
   - マイグレーションファイルはバージョン管理システムに含める

3. **型安全性の確保**

   - Prismaが生成する型定義を活用する
   - 型アサーションは必要な場合のみ使用する

4. **パフォーマンスの考慮**
   - N+1問題を避けるために `include` を適切に使用する
   - 大量のデータを扱う場合は `findMany` の代わりに `cursor` ベースのページネーションを使用する
   - トランザクションを使用して整合性を確保する

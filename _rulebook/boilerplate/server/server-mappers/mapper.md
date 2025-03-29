# マッパーのボイラープレート

## 目的

このファイルは、データベースモデルとドメインエンティティの間の変換を行うマッパーを定義します。
マッパーは、異なる層間でのデータ変換を担当し、各層が適切な形式のデータを
扱えるようにします。

## 配置場所

`server/server-mappers/{domain-name}/index.mapper.ts`

## ルール

1. ファイル名は `index.mapper.ts` とし、適切なドメインディレクトリに配置する
2. データベースモデルからドメインエンティティへの変換メソッド（toDomain）を実装する
3. 複数のデータベースモデルからドメインエンティティの配列への変換メソッド（toDomainCollection）を実装する
4. 型安全性を確保する
5. 変換ロジックは純粋関数として実装する
6. 内部実装を定義した後、最後に定数としてエクスポートする

## 実装例

```typescript
import { {DomainName}Entity } from 'common/domains/{domain-name}.entity'
import { {DomainName} as Prisma{DomainName} } from '@prisma/client'

/**
 * {DomainName}エンティティとPrismaモデル間の変換を行うマッパー
 */
const mapper = {
  /**
   * Prismaモデルから{DomainName}エンティティへの変換
   * @param model Prismaモデル
   * @returns {DomainName}エンティティ
   */
  toDomain: (model: Prisma{DomainName}): {DomainName}Entity => {
    return {
      id: model.id,
      name: model.name,
      // 他のフィールドの変換...
      // オプショナルなフィールドは null チェックを行う
      description: model.description ?? undefined,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    }
  },

  /**
   * 複数のPrismaモデルから{DomainName}エンティティの配列への変換
   * @param models Prismaモデルの配列
   * @returns {DomainName}エンティティの配列
   */
  toDomainCollection: (models: Prisma{DomainName}[]): {DomainName}Entity[] => {
    return models.map(mapper.toDomain)
  },
}

// マッパーをエクスポート
export const {domainName}Mapper = mapper
```

## 使用例

```typescript
// server/server-mappers/users/index.mapper.ts
import { UserEntity } from 'common/domains/user.entity'
import { User } from '@prisma/client'

export const userMapper = {
  toDomain: (user: User): UserEntity => {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'user',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  },

  toDomainCollection: (users: User[]): UserEntity[] => {
    return users.map(userMapper.toDomain)
  },
}
```

## 関連モデルを含むマッパーの例

```typescript
// server/server-mappers/prompts/index.mapper.ts
import { PromptEntity } from 'common/domains/prompt.entity'
import { Prompt, User } from '@prisma/client'
import { userMapper } from 'server/server-mappers/users/index.mapper'

export const promptMapper = {
  toDomain: (prompt: Prompt & { user?: User }): PromptEntity => {
    return {
      uniqueKey: prompt.uniqueKey,
      result: prompt.result ?? undefined,
      resultType: prompt.resultType ?? '',
      llmStatus: prompt.llmStatus,
      llmStatusChangeAt: prompt.llmStatusChangeAt ?? undefined,
      llmError: prompt.llmError ?? undefined,
      // 関連モデルが含まれている場合は変換
      user: prompt.user ? userMapper.toDomain(prompt.user) : undefined,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    }
  },

  toDomainCollection: (prompts: Prompt[]): PromptEntity[] => {
    return prompts.map(promptMapper.toDomain)
  },
}
```

## 注意点

1. **null と undefined の扱い**

   - Prismaは null を返すことがあるため、オプショナルなフィールドは `??` 演算子を使用して undefined に変換する
   - 例: `result: prompt.result ?? undefined`

2. **関連モデルの変換**

   - 関連モデルが含まれている場合は、対応するマッパーを使用して変換する
   - 例: `user: prompt.user ? userMapper.toDomain(prompt.user) : undefined`

3. **型の厳密さ**

   - 型アサーションは必要な場合のみ使用する
   - 例: `role: user.role as 'admin' | 'user'`

4. **命名規則の一貫性**
   - `toDomain` と `toDomainCollection` の命名規則を一貫して使用する
   - プロジェクト全体で一貫した命名規則を使用する

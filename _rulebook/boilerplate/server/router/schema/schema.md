# スキーマのボイラープレート

## 目的
このファイルは、APIエンドポイントの入力検証に使用するスキーマを定義します。
Zodを使用して型安全な検証ルールを定義します。

## 配置場所
`server/router/{resource-name}/schema/{action}.schema.ts`

## ルール
1. ファイル名は `{action}.schema.ts` とする（例: create.schema.ts, update.schema.ts）
2. 明確な検証ルールを定義する
3. エラーメッセージをカスタマイズする
4. 型安全性を確保する
5. 再利用可能なスキーマコンポーネントを作成する

## 実装例

```typescript
import { z } from 'zod';

/**
 * {DomainName}作成のための入力スキーマ
 */
export const {domainName}CreateSchema = z.object({
  /**
   * {DomainName}の名前
   * 1文字以上100文字以下の文字列
   */
  name: z.string()
    .min(1, { message: '名前は必須です' })
    .max(100, { message: '名前は100文字以下である必要があります' }),

  /**
   * {DomainName}の説明
   * オプション、最大500文字
   */
  description: z.string()
    .max(500, { message: '説明は500文字以下である必要があります' })
    .optional(),

  /**
   * {DomainName}のタイプ
   * 定義された値のいずれか
   */
  type: z.enum(['type1', 'type2', 'type3'], {
    errorMap: () => ({ message: 'タイプは有効な値である必要があります' }),
  }),

  /**
   * {DomainName}に関連するタグ
   * 文字列の配列
   */
  tags: z.array(z.string())
    .optional()
    .default([]),

  /**
   * {DomainName}の優先度
   * 1から5までの整数
   */
  priority: z.number()
    .int({ message: '優先度は整数である必要があります' })
    .min(1, { message: '優先度は1以上である必要があります' })
    .max(5, { message: '優先度は5以下である必要があります' })
    .optional()
    .default(3),

  // 他のフィールド...
});

/**
 * 入力スキーマから導出された型
 */
export type {DomainName}CreateInput = z.infer<typeof {domainName}CreateSchema>;
```

## 使用例

```typescript
// server/router/users/schema/create.schema.ts
import { z } from 'zod';

export const userCreateSchema = z.object({
  name: z.string()
    .min(1, { message: '名前は必須です' })
    .max(100, { message: '名前は100文字以下である必要があります' }),
    
  email: z.string()
    .email({ message: '有効なメールアドレスを入力してください' }),
    
  role: z.enum(['admin', 'user'], {
    errorMap: () => ({ message: 'ロールは admin または user である必要があります' }),
  }).default('user'),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
```

## 更新スキーマの例

```typescript
// server/router/users/schema/update.schema.ts
import { z } from 'zod';

export const userUpdateSchema = z.object({
  name: z.string()
    .min(1, { message: '名前は必須です' })
    .max(100, { message: '名前は100文字以下である必要があります' })
    .optional(),
    
  email: z.string()
    .email({ message: '有効なメールアドレスを入力してください' })
    .optional(),
    
  role: z.enum(['admin', 'user'], {
    errorMap: () => ({ message: 'ロールは admin または user である必要があります' }),
  }).optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

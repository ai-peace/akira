# ドメインエンティティのボイラープレート

## 目的
このファイルは、コアビジネス概念を表すドメインエンティティを定義します。
エンティティはフロントエンドとバックエンドで共有され、ビジネスオブジェクトの
本質的なプロパティと振る舞いのみを含むべきです。

## 配置場所
`common/domains/{domain-name}.entity.ts`

## ルール
1. ファイル名は `{domain-name}.entity.ts` とする
2. 明確なプロパティ型を持つTypeScript typeを定義する（interfaceではなく）
3. エンティティと各プロパティにJSDocコメントを含める
4. フロントエンドまたはバックエンド固有のロジックを含めない
5. データアクセスや永続化ロジックを含めない
6. エンティティはビジネスドメインに焦点を当てる
7. バリデーションロジックはエンティティに本質的な場合のみ含める

## 実装例

```typescript
/**
 * システム内の{DomainName}エンティティを表します
 */
export type {DomainName}Entity = {
  /**
   * {DomainName}の一意識別子
   */
  id: string;

  /**
   * {DomainName}の名前
   */
  name: string;

  /**
   * {DomainName}が作成された日時
   */
  createdAt: Date;

  /**
   * {DomainName}が最後に更新された日時
   */
  updatedAt: Date;

  // このエンティティを定義するその他の本質的なプロパティを追加
};
```

## 使用例

```typescript
// user.entity.ts
export type UserEntity = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
};

// prompt.entity.ts
export type PromptEntity = {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

# ソーシングワークフローの概要

## 目的

このワークフローは、複数のECサイトから商品情報を収集し、統一されたフォーマットで提供することを目的としています。

## 基本構造

各サイトに対して、以下の2つの主要なステップを実装します：

1. クエリビルダーステップ（build-query.{サイト名}.step.ts）
2. ページクローラーステップ（page-crawler.{サイト名}.step.ts）

## ワークフローの流れ

1. 入力された検索キーワードを翻訳（translate.step）
2. 各サイトごとに並行して：
   - クエリビルダーステップで検索URLを構築
   - ページクローラーステップで商品情報を収集
3. 収集した商品情報からタグを抽出（extract-tags.step）

## 統一データモデル

すべてのサイトは以下の共通のProductEntityモデルに従います：

```typescript
interface ProductEntity {
  uniqueKey: string
  title: {
    en: string
    ja: string
  }
  price: number
  priceWithTax?: number
  currency: string
  condition?: string
  description?: string
  imageUrl?: string
  url?: string
  status: StockStatus
  itemCode: string
  shopName: string
  shopIconUrl: string
}
```

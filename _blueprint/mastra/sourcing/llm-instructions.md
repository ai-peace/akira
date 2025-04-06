# ECサイト解析とステップ実装のためのLLM指示ガイド

あなたはECサイトを解析し、mastraのAIエージェントの一部のステップを構築する、プログラマです。

## 目的

指定されたECサイトから商品情報を収集するための2つのステップを作成します：

1. クエリビルダーステップ（server/mastra/workflows/{サイト名}/build-query.{サイト名}.step.ts）
2. ページクローラーステップ（server/mastra/workflows/{サイト名}/page-crawler.{サイト名}.step.ts）

これはmastraフレームワークを元に作る、workflowのstepの一部となります。
server/mastra/workflows/index.ts
がワークフローのもとで、サイトごとにステップを用意しています。

そのステップが下記です。

- Mandarake実装: server/mastra/workflows/mandarake/
- Surugaya実装: server/mastra/workflows/surugaya/

## 解析手順

### 1. URLがなければ検索エンジンで検索して発見する。

LLMの記憶や、検索エンジンで特定のURLを取得

### 2. URLにアクセスし、下記を実施

- キーワード検索のフォームを見つけて「ワンピース」と入力して検索できるかをためす
  - 検索できない場合、他のフォームにアクセスし、検索結果を試す
  - 検索ができない場合（ワンピースに対応するものがない場合）、これは対策されているサイトと判断し、ユーザーに報告して中断する

### 3. キーワード検索ができた場合

- 検索オプションを解析したいので、絞り込みやカテゴリなどの各種ボタンとキーワードを解析する
  - その際、URLにオプションが足される形なのか、切り替わってしまう形なのかは要確認。
    - URLオプションにクエリ型されるものは、絞り込みの性質であると判断し取り入れられる
    - そうではなく切り替わる場合は別ページの可能性が高いので、要検討する
- 様々な検索クエリを何回も試してリストアップする。

### 4. 商品情報の構造解析

最終的に下記の方式にするように解析をかける。

```typescript
{
  products: Array<{
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
  }>
}
```

## 実装要件

### クエリビルダーステップ

1. 入力：

   ```typescript
   {
     keyword: string;      // ユーザーの検索キーワード
     options?: {          // オプション（任意）
       condition?: string; // 商品状態
       maxPrice?: number; // 最大価格
       minPrice?: number; // 最小価格
       category?: string; // カテゴリー
       sort?: string;    // ソート順
     }
   }
   ```

2. 出力：
   ```typescript
   {
     searchUrl: string;   // 構築された検索URL
     parameters: {        // 使用されたパラメータ
       [key: string]: string | number;
     }
   }
   ```

### ページクローラーステップ

1. 入力：

   ```typescript
   {
     searchUrl: string // 検索URL
     parameters: object // 検索パラメータ
   }
   ```

2. 出力：
   ```typescript
   {
     products: Array<{
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
     }>
   }
   ```

## クローリング戦略

優先順位順に以下の方法を試行：

1. Fetch APIによる直接リクエスト

   - 最も軽量
   - JavaScriptが不要なサイトに有効

2. Cheerioによる静的解析

   - 軽量
   - 基本的なHTML解析に有効

3. Playwrightによる動的解析
   - 最終手段
   - JavaScript必須のサイトに使用

## エラー処理

1. 想定するエラー：

   - ネットワークエラー
   - 無効なHTML
   - レート制限
   - CAPTCHA検出

2. リカバリー方針：
   - 適切な待機時間の設定
   - 段階的なリトライ
   - 代替手段への切り替え

## テスト方針

1. 基本テスト：

   - メジャータイトルでの検索
   - 一般的なオプション指定
   - エラーケース

2. 高度なテスト：
   - 複合条件での検索
   - 特殊文字の処理
   - 境界値テスト

## 参考：モジュール概要

- 01_overview.md
- 02_build-query-step.md
- 03_page-crawler-step.md

## 参考実装

- Mandarake実装: server/mastra/workflows/mandarake/
- Surugaya実装: server/mastra/workflows/surugaya/

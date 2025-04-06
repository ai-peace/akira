# ECサイト解析とステップ実装のためのLLM指示ガイド

あなたは新しいECサイトの商品検索機能を実装するアシスタントです。

## 目的

指定されたECサイトから商品情報を収集するための2つのステップを作成します：

1. クエリビルダーステップ（build-query.{サイト名}.step.ts）
2. ページクローラーステップ（page-crawler.{サイト名}.step.ts）

## 前提条件

1. サイトのURLが特定できていること
2. 検索機能が利用可能であること
3. 基本的なアクセス制限がないこと

## 実装概要

- 01_overview.md
- 02_build-query-step.md
- 03_page-crawler-step.md

## 解析手順

### 1. サイトの基本解析

1. メインページにアクセスし、以下を確認：

   - 検索フォームの有無と形式
   - 基本的なナビゲーション構造
   - エラーページやCAPTCHAの有無

2. 検索機能の動作確認：
   - 基本的な検索（例：「ワンピース」）
   - 詳細検索オプションの確認
   - 検索結果ページの構造

### 2. 検索URLの解析

1. 検索時のURLパターンを確認：

   - ベースURL
   - クエリパラメータの形式
   - 必須パラメータと任意パラメータ

2. 特殊なパラメータの確認：
   - カテゴリー指定
   - 価格範囲
   - 商品状態
   - ソート順

### 3. 商品情報の構造解析

1. 商品リストの構造：

   - リストのコンテナ要素
   - 個別商品要素
   - ページネーション要素

2. 商品詳細情報：
   - タイトル
   - 価格
   - 在庫状態
   - 画像URL
   - 商品URL

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

## 参考実装

- Mandarake実装: server/mastra/workflows/mandarake/
- Surugaya実装: server/mastra/workflows/surugaya/

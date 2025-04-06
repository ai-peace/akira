# カードラッシュポケモン スクレイピングデバッグ手順

## 概要

カードラッシュポケモンサイトからの商品スクレイピングのデバッグ用スクリプトとその使用方法です。

## デバッグの手順

### 1. サーバー起動

まず、Mastraサーバーを起動します：

```bash
pnpm mastra:dev
```

### 2. ワークフロー実行

別のターミナルで、以下のコマンドを実行してワークフローをテストします：

```bash
./scripts/test-cardrush.sh
```

または直接curlコマンドを実行：

```bash
curl -X POST "http://localhost:3000/api/workflows/cardrush-pokemon" \
  -H "Content-Type: application/json" \
  -d '{
    "promptUniqueKey": "dec25340-f547-4148-99e3-df9fce4e0e1d",
    "keyword": "マリィ",
    "options": {
      "stock": "in-stock",
      "sort": "price-asc",
      "display": "100"
    }
  }'
```

### 3. デバッグ用HTMLの解析

サーバーがデバッグディレクトリに保存したHTMLファイルを解析するには：

```bash
npx ts-node scripts/analyze-cardrush.ts
```

## 実装の改善点

1. YAMLスナップショット形式からの商品データ抽出を追加
2. 複数のセレクタを試し、最適なものを自動選択
3. 検索結果数の取得方法を複数追加
4. HTMLからの直接パターンマッチングで商品情報を抽出
5. デバッグ用の機能を強化

## 問題解決のポイント

- サイトのHTMLが取得できても、検索結果数が0と判定される問題を解決
- 在庫ありのフィルタリングで商品が表示されない問題を解決
- YAMLスナップショット形式からの直接データ抽出機能を追加

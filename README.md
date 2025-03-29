# Next.js 15 + Hono テンプレート

Next.js 15とHonoを組み合わせた、モダンなフルスタックアプリケーション開発のためのテンプレートプロジェクトです。このテンプレートは、効率的なAPI開発とフロントエンド開発を同時に行うための基盤を提供します。

## 概要

このプロジェクトは、Next.jsのApp Routerを使用したフロントエンドとHonoを使用したバックエンドAPIを統合したフルスタックアプリケーションです。ユーザー管理とプロンプト処理の機能を備えており、LangChainを使用したLLM（大規模言語モデル）との統合も可能です。

### 主な機能

- **ユーザー管理**: ユーザーの作成、取得、認証
- **プロンプト処理**: ユーザーからのプロンプトの作成と処理
- **LLM統合**: LangChainを使用したLLMとの連携
- **データベース**: Prismaを使用したPostgreSQLデータベース管理

## 技術スタック

### バックエンド

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [Hono](https://hono.dev/) - 軽量で高速なWebフレームワーク
- [Prisma](https://www.prisma.io/) - Node.js/TypeScript用のORMツール
- [PostgreSQL](https://www.postgresql.org/) - リレーショナルデータベース
- [LangChain](https://js.langchain.com/) - LLM統合フレームワーク

### フロントエンド

- [React](https://reactjs.org/) - UIライブラリ
- [TailwindCSS](https://tailwindcss.com/) - ユーティリティファーストのCSSフレームワーク
- [shadcn/ui](https://ui.shadcn.com/) - 再利用可能なUIコンポーネント
- [SWR](https://swr.vercel.app/) - データフェッチングライブラリ
- [Lucide React](https://lucide.dev/) - アイコンライブラリ

### 開発ツール

- [TypeScript](https://www.typescriptlang.org/) - 型付きJavaScript
- [ESLint](https://eslint.org/) - コード品質チェックツール
- [Prettier](https://prettier.io/) - コードフォーマッター
- [Zod](https://zod.dev/) - TypeScriptファーストのスキーマバリデーションライブラリ

## プロジェクト構造

```
.
├── app/                    # Next.js App Router
│   ├── api/                # API routes using Hono
│   └── ...                 # Page components
├── common/                 # Shared domain models
│   ├── domains/            # Domain entities
│   └── errors/             # Error definitions
├── front/                  # Client-side code
│   ├── api-client/         # API client
│   ├── components/         # UI components (Atomic Design)
│   │   ├── 01_elements/    # Basic UI elements
│   │   ├── 02_organisms/   # Domain-specific components
│   │   ├── 03_templates/   # Reusable page sections
│   │   └── 04_screens/     # Full screen components
│   ├── hooks/              # React hooks
│   │   └── resources/      # Resource hooks (SWR)
│   └── repositories/       # Data access layer
├── public/                 # Static assets
├── server/                 # Server-side code
│   ├── prisma/             # Database schema and migrations
│   ├── router/             # API endpoints
│   ├── server-mappers/     # Data transformation
│   └── server-service/     # Business logic
└── _rulebook/              # Development guidelines
```

## セットアップと起動方法

### 前提条件

- Node.js 18以上
- pnpm
- PostgreSQL

### インストール

```bash
# 依存関係のインストール
pnpm install
```

### データベースのセットアップ

1. PostgreSQLデータベースを用意します（Docker Composeを使用する場合）:

```bash
# Dockerでデータベースを起動
docker-compose up -d
```

2. 環境変数を設定します:

```bash
# .env.sampleをコピーして.envを作成
cp .env.sample .env
# 必要に応じて.envファイルを編集
```

3. データベースマイグレーションを実行します:

```bash
# マイグレーションの適用
pnpm migrate:deploy
```

### 開発サーバーの起動

```bash
# 開発サーバーを起動
pnpm dev
```

アプリケーションは http://localhost:3000 で利用可能になります。

### ビルドと本番環境での実行

```bash
# アプリケーションのビルド
pnpm build

# 本番環境でのサーバー起動
pnpm start
```

## 開発ガイド

このプロジェクトには、開発者向けのユースケースとガイドラインが`_rulebook`ディレクトリに用意されています。主なユースケースは以下の通りです：

- 新しいリソースをクライアントで読み込む方法
- データベースに新しいテーブルを作成する方法
- 新しい画面（ページ）を作成する方法
- 新しいAPIエンドポイントを追加する方法
- 新しいUIコンポーネントを作成する方法
- エラーハンドリングを実装する方法

詳細は`_rulebook/usecases/usecases.md`を参照してください。

## データベース操作

```bash
# マイグレーションファイルの生成（変更を適用せず）
pnpm migrate:generate <migration-name>

# マイグレーションの適用
pnpm migrate:deploy

# データベースのリセット（全テーブルを削除して再作成）
pnpm db:reset

# スキーマの変更をデータベースに直接反映（開発時のみ）
pnpm db:push

# Prismaクライアントの生成
pnpm prisma:generate
```

## ライセンス

[MIT](LICENSE)

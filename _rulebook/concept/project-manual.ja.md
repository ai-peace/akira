Next.js 15 Hono テンプレート - プロジェクトマニュアル

# 目次

- [はじめに](#はじめに)
- [プロジェクトウォークスルー](#プロジェクトウォークスルー)
- [プロジェクト概要](#プロジェクト概要)
- [ディレクトリ構造](#ディレクトリ構造)
  - [ルート設定ファイル](#ルート設定ファイル)
- [フロントエンドアーキテクチャ (front/)](#フロントエンドアーキテクチャ-front)
  - [APIクライアント (front/api-client/)](#apiクライアント-frontapi-client)
  - [コンポーネント (front/components/)](#コンポーネント-frontcomponents)
    - [エレメント (01_elements/)](#エレメント-01_elements)
    - [オーガニズム (02_organisms/)](#オーガニズム-02_organisms)
    - [テンプレート (03_templates/)](#テンプレート-03_templates)
    - [スクリーン (04_screens/)](#スクリーン-04_screens)
    - [UIコンポーネント (ui/)](#uiコンポーネント-ui)
  - [定数 (front/consts/)](#定数-frontconsts)
  - [フック (front/hooks/)](#フック-fronthooks)
    - [リソースフック (resources/)](#リソースフック-resources)
  - [ライブラリ (front/lib/)](#ライブラリ-frontlib)
  - [リポジトリ (front/repositories/)](#リポジトリ-frontrepositories)
  - [スタイル (front/styles/)](#スタイル-frontstyles)
- [バックエンドアーキテクチャ (server/)](#バックエンドアーキテクチャ-server)
  - [Prisma (server/prisma/)](#prisma-serverprisma)
  - [ルーター (server/router/)](#ルーター-serverrouter)
  - [サーバー定数 (server/server-const/)](#サーバー定数-serverserver-const)
  - [サーバーライブラリ (server/server-lib/)](#サーバーライブラリ-serverserver-lib)
  - [サーバーマッパー (server/server-mappers/)](#サーバーマッパー-serverserver-mappers)
  - [サーバーサービス (server/server-service/)](#サーバーサービス-serverserver-service)
  - [サーバーユースケース (server/server-usecase/)](#サーバーユースケース-serverserver-usecase)
- [共通アーキテクチャ (common/)](#共通アーキテクチャ-common)
  - [ドメイン (common/domains/)](#ドメイン-commondomains)
- [Appディレクトリ (app/)](#appディレクトリ-app)
- [Publicディレクトリ (public/)](#publicディレクトリ-public)
- [アーキテクチャパターン](#アーキテクチャパターン)
  - [ドメイン駆動設計 (DDD)](#ドメイン駆動設計-ddd)
  - [クリーンアーキテクチャ](#クリーンアーキテクチャ)
  - [Atomic Design](#atomic-design)
  - [リポジトリパターン](#リポジトリパターン)
- [開発ガイドライン](#開発ガイドライン)
  - [命名規則](#命名規則)
  - [コード構成](#コード構成)
  - [ベストプラクティス](#ベストプラクティス)
- [結論](#結論)

# はじめに

このドキュメントは、Next.js 15 Hono テンプレートのプロジェクト構造、アーキテクチャ、開発ガイドラインを包括的に説明するガイドです。このテンプレートは、Next.js 15とHonoを使用した最新のウェブアプリケーションを構築するための堅固な基盤を提供することを目的としています。

# プロジェクトウォークスルー

詳細なドキュメントに入る前に、このプロジェクトがどのように構成され、各部分がどのように連携しているかの概要を説明します：

1. **アーキテクチャ概要**: このプロジェクトはクリーンアーキテクチャアプローチとドメイン駆動設計の原則に従っています。コードベースは明確な責任を持つ異なる層に整理されています：

   - **ドメイン層**: `common/domains/`にビジネスエンティティとロジックを含む
   - **アプリケーション層**: `server/server-usecase/`にユースケースを実装
   - **インフラストラクチャ層**: `front/repositories/`と`server/`にデータアクセスなどの外部関心事を処理
   - **プレゼンテーション層**: `front/components/`にUIコンポーネント、`server/router/`にAPIエンドポイントを管理

2. **データフロー**:

   - クライアント側のデータ取得はリソースフック（`front/hooks/resources/`）を使用し、リポジトリを呼び出す
   - リポジトリ（`front/repositories/`）はHonoクライアントを使用してAPIと通信
   - APIエンドポイント（`server/router/`）はスキーマで入力を検証し、ユースケースに委譲
   - ユースケース（`server/server-usecase/`）はビジネスロジックを実装し、サービスと連携
   - サービス（`server/server-service/`）は特殊な機能を提供
   - マッパー（`server/server-mappers/`）は異なる層間でデータを変換

3. **UIコンポーネント階層**:

   - Atomic Designの原則に従い、UIコンポーネントは複雑さの増加順に整理されています：
   - エレメント(01) → オーガニズム(02) → テンプレート(03) → スクリーン(04)
   - スクリーンコンポーネントは通常、リソースフックを使用してデータを取得

4. **主要な規約**:
   - 一貫した命名パターン（例：`{domain-name}.entity.ts`、`use{ResourceName}.ts`）
   - クライアントコードとサーバーコードの明確な分離
   - コードベース全体の型安全性
   - 単一責任の原則に基づくモジュラー構成

このアーキテクチャは、関心事を分離し、依存関係が一方向に流れるようにすることで、保守性、テスト容易性、スケーラビリティを促進します。

# プロジェクト概要

このプロジェクトは、クリーンアーキテクチャアプローチとドメイン駆動設計の影響を受けたNext.jsベースのウェブアプリケーションです。以下の技術を使用しています：

- **Next.js 15**: フロントエンドフレームワーク（App Router使用）
- **Hono**: API実装
- **Prisma**: データベース操作
- **Atomic Design**: コンポーネント構成
- **TypeScript**: コードベース全体の型安全性確保

# ディレクトリ構造

プロジェクトは、それぞれ特定の目的を持つ複数のメインディレクトリに整理されています：

```
/
├── app/                  # Next.js App Router
├── common/               # 共有ドメインモデル
├── front/                # クライアントサイドコード
├── public/               # 静的アセット
├── server/               # サーバーサイドコード
└── _rulebook/            # プロジェクトドキュメント
```

## ルート設定ファイル

ルートディレクトリには、プロジェクトのさまざまな設定ファイルが含まれています：

- `.env.sample`: 環境変数の例
- `.eslintrc.json`: ESLint設定
- `.gitignore`: Gitの無視ルール
- `.prettierrc`: Prettier設定
- `components.json`: UIコンポーネント設定
- `docker-compose.yml`: Docker Compose設定
- `next-env.d.ts`: Next.js型定義
- `next.config.js`: Next.js設定
- `package.json`: プロジェクト依存関係
- `pnpm-lock.yaml`: PNPMロックファイル
- `postcss.config.js`: PostCSS設定
- `tailwind.config.js`: Tailwind CSS設定
- `tsconfig.json`: TypeScript設定

# フロントエンドアーキテクチャ (`front/`)

フロントエンドコードは、モジュラー構造に従って`front/`ディレクトリに整理されています：

## APIクライアント (`front/api-client/`)

バックエンドと通信するためのAPIクライアントを含みます：

- `hc.api-client.ts`: API通信用のHonoクライアント

## コンポーネント (`front/components/`)

UIコンポーネントはAtomic Design手法に従って整理されています：

### エレメント (`01_elements/`)

ドメインに依存しない、再利用可能なUI要素。ドメイン知識を持たず、プロパティを受け取ります：

- 命名規則: `E{elementName}` (例: `EButton`, `EInput`)
- 各コンポーネントは通常以下を持ちます：
  - `index.tsx`: メインコンポーネント実装
  - `collection.tsx`: コンポーネントバリアントのコレクション

### オーガニズム (`02_organisms/`)

ドメインに依存するコンポーネント。ドメイン知識を持ち、プロパティを必要としません：

- 命名規則: `O{organismName}` (例: `OBottomLoginButton`, `OChatBubbleProduct`)
- 各コンポーネントは通常以下を持ちます：
  - `index.tsx`: メインコンポーネント実装
  - `collection.tsx`: コンポーネントバリアントのコレクション

### テンプレート (`03_templates/`)

画面の一部を構成する再利用可能なパーツ。フル画面ではありません：

- 命名規則: `T{templateName}` (例: `TChatMessageContent`, `TCreateDocumentForm`)
- 各テンプレートは通常以下を持ちます：
  - `index.tsx`: メインコンポーネント実装

### スクリーン (`04_screens/`)

フル画面コンポーネント。プロパティを持たず、通常はリソースフックを通じてデータを取得します：

- 命名規則: `S{screenName}` (例: `SUserShowScreen`)
- 各スクリーンは通常以下を持ちます：
  - `index.tsx`: メインコンポーネント実装

### UIコンポーネント (`ui/`)

shadcn/uiスキャフォールドからのShadcn/uiコンポーネント：

- `button.tsx`などの様々なUIコンポーネント

## 定数 (`front/consts/`)

アプリケーション定数と設定値：

- `application-url.front-const.ts`: APIエンドポイントとルートのURL定数
- `application-properties.front-const.ts`: アプリケーションプロパティと設定

## フック (`front/hooks/`)

カスタムReactフック：

### リソースフック (`resources/`)

SWRを使用した自動データフェッチングとキャッシングによるエンティティ管理用フック：

- 命名規則: `use{Action}{ResourceName}.ts` または `use{ResourceName}.ts`

  - `use{ResourceName}.ts`: 一般的なリソースアクセス用（例：`useUser.ts`）
  - `use{Action}{ResourceName}.ts`: 特定のアクション用（例：`useCreateUser.ts`）

- 一般的なパターン:

  - `useCreate{ResourceName}.ts`: リソース作成用
  - `useUpdate{ResourceName}.ts`: リソース更新用
  - `useDelete{ResourceName}.ts`: リソース削除用
  - `use{ResourceName}List.ts`: リソースリスト取得用
  - `use{ResourceName}Detail.ts`: リソース詳細情報取得用

- 例:
  - `useCreateUser.ts`: ユーザー作成用フック
  - `usePrompt.ts`: プロンプトリソース用フック
  - `useUser.ts`: ユーザーリソース用フック

## ライブラリ (`front/lib/`)

ユーティリティ関数とライブラリ：

- `utils.ts`: 一般的なユーティリティ関数

## リポジトリ (`front/repositories/`)

クライアントアプリケーションのデータアクセス層：

- 命名規則: `{domain-name}.repository.ts`

  - 各リポジトリは対応するドメインエンティティに対応
  - リポジトリはそのエンティティに対するすべてのデータアクセス操作を処理

- 一般的なメソッド:

  - `create{EntityName}`: 新しいエンティティを作成
  - `update{EntityName}`: 既存のエンティティを更新
  - `delete{EntityName}`: エンティティを削除
  - `get{EntityName}`: IDによる単一エンティティの取得
  - `list{EntityName}s`: エンティティのリスト取得（フィルタリング可能）

- 例:
  - `prompt.repository.ts`: プロンプトエンティティ用リポジトリ
  - `user.repository.ts`: ユーザーエンティティ用リポジトリ

## スタイル (`front/styles/`)

アプリケーションのグローバルスタイル：

- `globals.css`: グローバルCSSスタイル

# バックエンドアーキテクチャ (`server/`)

サーバーサイドコードは`server/`ディレクトリに整理されています：

## Prisma (`server/prisma/`)

データベース設定とマイグレーション：

- `schema.prisma`: Prismaスキーマ定義
- `migrations/`: データベースマイグレーション

## ルーター (`server/router/`)

Honoを使用したAPIルーター実装：

- 命名規則: リソースベースの構成
  - トップレベルリソース: `/{resource-name}/`（例：`users/`）
  - ネストされたリソース: `/{parent-resource}/{child-resource}/`（例：`users/prompts/`）
- エンドポイントファイル:

  - `create.ts`: 作成エンドポイント（POST）
  - `show.ts`: 詳細表示エンドポイント（GET）
  - `update.ts`: 更新エンドポイント（PUT/PATCH）
  - `delete.ts`: 削除エンドポイント（DELETE）
  - `index.ts`: 一覧エンドポイント（GET）

- スキーマファイル:

  - `schema/{action}.schema.ts`: 入力検証スキーマ（例：`schema/create.schema.ts`）

- 例:
  - `types.ts`: Honoを使用したクライアントサイド用の型定義
  - `users/create.ts`: ユーザー作成エンドポイント
  - `users/show.ts`: ユーザー表示エンドポイント
  - `users/prompts/create.ts`: ユーザープロンプト作成エンドポイント

## サーバー定数 (`server/server-const/`)

サーバーサイドの定数と設定：

- 命名規則: `{name}.server-const.ts`
- 例: `appilication.server-const.ts`: アプリケーション定数

## サーバーライブラリ (`server/server-lib/`)

サーバーサイドユーティリティライブラリ：

- 命名規則: `{name}.ts` または `{name}.util.ts`
- 例:
  - `prisma-service.util.ts`: Prismaサービスユーティリティ
  - `safe-structured-output-parser.ts`: 出力パーサー
  - `uuid.ts`: UUIDユーティリティ

## サーバーマッパー (`server/server-mappers/`)

異なる層間のデータ変換ロジック：

- 命名規則:
  - ディレクトリ: `{domain-name}/`
  - ファイル: `index.mapper.ts` または `{specific-mapping}.mapper.ts`
- 例:
  - `prompts/index.mapper.ts`: プロンプトエンティティマッパー
  - `users/index.mapper.ts`: ユーザーエンティティマッパー

## サーバーサービス (`server/server-service/`)

ビジネスロジック実装層：

- 命名規則:
  - ディレクトリ: `{service-name}/`
  - ファイル: `{service-name}.server-service.ts` またはツールの場合は `index.tool.ts`
- 例:
  - `conversation-agent/index.tool.ts`: 会話エージェントツール
  - `conversation-agent/prompt.ts`: プロンプトテンプレート

## サーバーユースケース (`server/server-usecase/`)

アプリケーションユースケース実装：

- 命名規則: `{usecase-name}.server-usecase.ts`
- 例: `generate-user-response.usecase.ts`: ユーザーレスポンス生成ユースケース

# 共通アーキテクチャ (`common/`)

フロントエンドとバックエンド間の共有コード：

## ドメイン (`common/domains/`)

クライアントとサーバー間で共有されるドメインエンティティ：

- `prompt.entity.ts`: プロンプトエンティティ
- `user.entity.ts`: ユーザーエンティティ

# Appディレクトリ (`app/`)

Next.js App Router実装：

- `layout.tsx`: アプリのレイアウト
- `page.tsx`: メインページ
- `(app)/`: アプリのメインルート
- `api/[...route]/`: ミドルウェアHonoを使用したAPIルート

# Publicディレクトリ (`public/`)

アプリケーションの静的アセット：

- `icon512_maskable.png`: PWA用のマスカブルアイコン
- `icon512_rounded.png`: PWA用の丸いアイコン
- `manifest.json`: PWAマニフェスト

# アーキテクチャパターン

このプロジェクトは、いくつかのアーキテクチャパターンと原則に従っています：

## ドメイン駆動設計 (DDD)

- ドメインエンティティの明確な分離
- データアクセスのためのリポジトリの使用
- ドメイン固有のサービスとユースケース

## クリーンアーキテクチャ

- 層間の関心事の分離
- フレームワークからのドメインロジックの独立
- データ変換のためのマッパーの使用

## Atomic Design

Atomic Design手法に基づくコンポーネント階層：

- エレメント：最小のUIコンポーネント
- オーガニズム：複数のエレメントを組み合わせた機能単位
- テンプレート：画面の一部
- スクリーン：フル画面コンポーネント

## リポジトリパターン

- データアクセスロジックの抽象化
- 一元化されたデータ操作
- ビジネスロジックからのデータアクセスの分離

# 開発ガイドライン

## 命名規則

- **コンポーネント**: Atomic Designのプレフィックスに従う：

  - エレメント: `E{elementName}` (例: `EButton`)
  - オーガニズム: `O{organismName}` (例: `OBottomLoginButton`)
  - テンプレート: `T{templateName}` (例: `TChatMessageContent`)
  - スクリーン: `S{screenName}` (例: `SUserShowScreen`)

- **ファイル**:
  - エンティティファイル: `{domain-name}.entity.ts`
  - リポジトリファイル: `{domain-name}.repository.ts`
  - リソースフック: `use{ResourceName}.ts`
  - サーバー定数: `{name}.server-const.ts`
  - フロント定数: `{name}.front-const.ts`

## コード構成

1. **ドメインロジック**: ドメインエンティティを`common/domains/`に配置
2. **フロントエンドロジック**: コンポーネント階層に従って`front/`に整理
3. **バックエンドロジック**: 関心事の明確な分離を持つ`server/`に整理
4. **APIエンドポイント**: 適切なスキーマ検証を持つ`server/router/`で定義
5. **データアクセス**: `front/repositories/`を通じて実装

## ベストプラクティス

1. **型安全性**: コードベース全体でTypeScriptを使用
2. **コンポーネント設計**: Atomic Designの原則に従う
3. **データフェッチング**: 自動キャッシングのためのSWRを使用したリソースフック
4. **API通信**: 型安全なAPI呼び出しのためのHonoクライアントを使用
5. **定数**: 専用ファイルでアプリケーション定数を定義
6. **スキーマ検証**: スキーマを使用してAPI入力を検証

# 結論

このプロジェクト構造は、スケーラブルで保守可能なウェブアプリケーションを構築するための堅固な基盤を提供します。このマニュアルで概説されているアーキテクチャパターンと開発ガイドラインに従うことで、開発者はコードベース全体の一貫性と品質を確保できます。

関心事の分離、明確な命名規則、モジュラーな構成により、アプリケーションが複雑さを増しても、理解、拡張、保守が容易になります。

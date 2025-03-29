このドキュメントは、
開発者のユースケース一覧および、ユースケースそれぞれに対応したrulebookのインデックスです。
あなたがLLMが最小限のInputTokenでアクションできるようにするためです

## 新しいresourceをclientで読み込みたい

フロントエンドからバックエンドのリソースにアクセスする完全なフローです。
エンティティ設計からAPI実装、リポジトリとフックの作成まで、全ての必要なステップを網羅しています。

```yml
process:
  steps:
    - name: データベーステーブルの作成
      location: server/prisma
      rulebook: _rulebook/boilerplate/server/prisma
      tasks:
        - schema.prismaにテーブル定義を追加
        - マイグレーションを実行

    - name: エンティティの設計
      location: common/domains
      rulebook: _rulebook/boilerplate/common/domains
      tasks:
        - '{resource-name}.entity.ts'を作成
        - 必要な型定義を行う

    - name: APIエンドポイント実装
      location: server/router
      rulebook: _rulebook/boilerplate/server/router
      tasks:
        - '/{resource-name}/'ディレクトリを作成
        - 'schema/'サブディレクトリ作成（必要に応じて）
        - CRUDエンドポイント実装（create.ts, show.ts, index.ts, update.ts, delete.ts）

    - name: APIルート追加
      location: app/api/[...route]/route.ts
      rulebook: _rulebook/boilerplate/app/api/[...route]
      tasks:
        - 'import'文の追加
        - 'hono.route()'の追加

    - name: ルータータイプ更新
      location: server/router/types.ts
      rulebook: _rulebook/boilerplate/server/router
      tasks:
        - ルート型のインポート
        - ApiRoutesユニオン型に追加

    - name: リポジトリ実装
      location: front/repositories
      rulebook: _rulebook/boilerplate/front/repositories
      tasks:
        - '{resource-name}.repository.ts'の作成
        - CRUD操作の実装（get, create, update, delete, list）

    - name: リソースフック実装
      location: front/hooks/resources
      rulebook: _rulebook/boilerplate/front/hooks/resources
      tasks:
        - 'use{ResourceName}.ts'の実装
        - 必要に応じて特定アクション用フックの実装
        - SWRを使用したデータフェッチング実装

    - name: コンポーネント内での使用
      location: front/components
      rulebook: _rulebook/boilerplate/front/components
      tasks:
        - コンポーネント内でリソースフックをインポート
        - データ取得・操作ロジックの実装
```

## DBに新しいテーブルを作りたい

データベーススキーマを拡張し、新しいテーブルを追加するプロセスです。
Prismaスキーマの更新からマイグレーション適用までの手順を説明しています。

```yml
process:
  steps:
    - name: Prismaスキーマの更新
      location: server/prisma/schema.prisma
      rulebook: _rulebook/boilerplate/server/prisma
      tasks:
        - 新しいモデル定義を追加
        - 必要なリレーションを設定
        - フィールドと型を定義

    - name: マイグレーションファイル作成
      location: server/prisma/migrations
      rulebook: _rulebook/boilerplate/server/prisma
      tasks:
        - マイグレーションコマンド実行 (pnpm prisma migrate dev)
        - マイグレーション名の設定
        - 生成されたSQLの確認

    - name: マイグレーション適用
      location: server/prisma
      rulebook: _rulebook/boilerplate/server/prisma
      tasks:
        - 開発環境でのマイグレーション実行
        - Prismaクライアントの再生成
        - スキーマの変更が正しく反映されたか確認
```

## 新しい画面（ページ）を作成したい

ユーザーに表示する新しい画面（ページ）を作成するプロセスです。
Next.jsのApp Routerを使用したページ作成から、必要なコンポーネントの実装まで説明しています。

```yml
process:
  steps:
    - name: ページファイルの作成
      location: app/
      rulebook: _rulebook/boilerplate/app
      tasks:
        - 適切なディレクトリ構造を作成（例：app/[path]/page.tsx）
        - 動的ルーティングが必要な場合は[param]形式のディレクトリを作成
        - ページコンポーネントの基本構造を実装

    - name: 画面コンポーネントの作成
      location: front/components/04_screens
      rulebook: _rulebook/boilerplate/front/components/04_screens
      tasks:
        - 'S{ScreenName}'ディレクトリを作成
        - 'index.tsx'ファイルを作成
        - 'use client'ディレクティブを追加
        - 必要なフックやコンポーネントをインポート
        - 画面のレイアウトと機能を実装

    - name: データ取得ロジックの実装
      location: front/hooks/resources
      rulebook: _rulebook/boilerplate/front/hooks/resources
      tasks:
        - 必要に応じて新しいフックを作成または既存のフックを使用
        - SWRを使用したデータフェッチングの実装
        - エラーハンドリングとローディング状態の管理

    - name: ページとコンポーネントの接続
      location: app/[path]/page.tsx
      tasks:
        - 作成した画面コンポーネントをインポート
        - ページコンポーネントから画面コンポーネントを呼び出し
```

## 新しいAPIエンドポイントを追加したい

バックエンドAPIに新しいエンドポイントを追加するプロセスです。
Honoを使用したルーターの実装からAPIルートへの登録まで説明しています。

```yml
process:
  steps:
    - name: APIエンドポイントの実装
      location: server/router
      rulebook: _rulebook/boilerplate/server/router
      tasks:
        - 適切なディレクトリ構造を作成（例：server/router/[resource]/[action].ts）
        - Honoインスタンスの作成
        - リクエストハンドラの実装
        - エラーハンドリングの追加

    - name: バリデーションスキーマの作成
      location: server/router/[resource]/schema
      rulebook: _rulebook/boilerplate/server/router/schema
      tasks:
        - '[action].schema.ts'ファイルを作成
        - Zodスキーマの定義
        - 型の出力と必要な検証ルールの設定

    - name: APIルートへの登録
      location: app/api/[...route]/route.ts
      rulebook: _rulebook/boilerplate/app/api/[...route]
      tasks:
        - 新しいエンドポイントのインポート
        - 'hono.route()'を使用したルートの登録

    - name: ルータータイプの更新
      location: server/router/types.ts
      rulebook: _rulebook/boilerplate/server/router
      tasks:
        - 新しいルート型のインポート
        - ApiRoutesユニオン型への追加
```

## 新しいUIコンポーネントを作成したい

再利用可能なUIコンポーネントを作成するプロセスです。
Atomic Designの原則に基づいたコンポーネント設計と実装方法を説明しています。

```yml
process:
  steps:
    - name: コンポーネント階層の決定
      tasks:
        - コンポーネントの役割と複雑さを評価
        - 適切な階層を選択（01_elements, 02_organisms, 03_templates）

    - name: コンポーネントの作成
      location: front/components/[階層]
      rulebook: _rulebook/boilerplate/front/components/[階層]
      tasks:
        - コンポーネントディレクトリを作成
        - 'index.tsx'ファイルを作成
        - 必要に応じて'use client'ディレクティブを追加
        - propsの型定義
        - コンポーネントの実装

    - name: スタイルの適用
      tasks:
        - TailwindCSSクラスの適用
        - レスポンシブデザインの考慮
        - アクセシビリティの確保

    - name: コンポーネントのエクスポート
      tasks:
        - 適切な名前でコンポーネントをエクスポート
        - 必要に応じてバリエーションを提供
```

## エラーハンドリングを実装したい

アプリケーション全体で一貫したエラーハンドリングを実装するプロセスです。
フロントエンドとバックエンドの両方でのエラー処理方法を説明しています。

```yml
process:
  steps:
    - name: バックエンドエラーの定義
      location: common/errors
      rulebook: _rulebook/boilerplate/common/errors
      tasks:
        - エラーコードの定義
        - エラーメッセージの標準化
        - エラー生成ヘルパー関数の実装

    - name: APIエンドポイントでのエラーハンドリング
      location: server/router
      rulebook: _rulebook/boilerplate/server/router
      tasks:
        - try-catchブロックの実装
        - 適切なエラーコードとメッセージの返却
        - ログ記録の追加

    - name: フロントエンドでのエラーハンドリング
      location: front/hooks/resources
      rulebook: _rulebook/boilerplate/front/hooks/resources
      tasks:
        - エラー状態の管理
        - エラータイプの判別
        - ユーザーフレンドリーなエラーメッセージの表示

    - name: UIでのエラー表示
      location: front/components
      rulebook: _rulebook/boilerplate/front/components
      tasks:
        - エラーコンポーネントの作成
        - 条件付きレンダリングの実装
        - リトライメカニズムの提供（必要に応じて）
```

## ローカルDBを用いたキャッシュ戦略を実装したい

オフライン対応やパフォーマンス向上のためのローカルキャッシュ戦略を実装するプロセスです。
IndexedDBを使用したデータの永続化と、オンライン/オフライン対応のリポジトリパターンを説明しています。

```yml
process:
  steps:
    - name: IndexedDBの設定
      location: front/lib
      rulebook: _rulebook/boilerplate/front/lib/indexed-db
      tasks:
        - 'indexed-db.ts'ファイルの作成
        - データベース名とバージョンの定義
        - オブジェクトストアの設定
        - シングルトンパターンの実装

    - name: 基本的なリポジトリの実装
      location: front/repositories
      rulebook: _rulebook/boilerplate/front/repositories/repository-with-offline
      tasks:
        - シンプルなエンティティ用のリポジトリ作成
        - get, save, destroyメソッドの実装
        - IndexedDBとの連携

    - name: オンライン/オフライン対応リポジトリの実装
      location: front/repositories
      rulebook: _rulebook/boilerplate/front/repositories/repository-with-offline
      tasks:
        - オンラインリポジトリの実装（APIクライアント連携）
        - オフラインリポジトリの実装（IndexedDB連携）
        - メインリポジトリでの戦略パターン実装

    - name: キャッシュ戦略の定義
      location: front/repositories
      rulebook: _rulebook/boilerplate/front/repositories/repository-with-offline
      tasks:
        - データ取得戦略の実装（online-first, offline-first, version-compare）
        - データ保存戦略の実装（online-only, offline-only, both）
        - コンフリクト解決ロジックの実装

    - name: Reactフックの作成
      location: front/hooks
      rulebook: _rulebook/boilerplate/front/repositories/repository-with-offline
      tasks:
        - リポジトリを使用するカスタムフックの実装
        - ローディング状態とエラー処理の管理
        - 戦略を切り替えるためのインターフェース提供

    - name: オフライン対応の強化
      location: front/lib
      rulebook: _rulebook/boilerplate/front/repositories/repository-with-offline
      tasks:
        - ネットワーク状態の監視機能の実装
        - 同期キューの実装（オフライン時の変更を記録）
        - ユーザーへのフィードバック機能の実装
```

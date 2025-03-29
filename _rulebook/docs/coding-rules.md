# コーディングルール

このドキュメントでは、プロジェクト全体で一貫性を保つためのコーディングルールを定義します。

## 一般的なルール

1. **型定義には `type` を優先する**
   - よほどのことがなければ `interface` ではなく `type` を使用する
   - 拡張が必要な場合のみ `interface` を検討する

2. **命名規則は一貫性を保つ**
   - キャメルケース: 変数、関数、メソッド、プロパティ
   - パスカルケース: 型、インターフェース、クラス、コンポーネント
   - スネークケース: 定数

## コンポーネントのルール

1. **コンポーネントの構造**
   ```typescript
   // 1. Props の型定義
   type Props = {
     // プロパティの定義
   };

   // 2. コンポーネントの実装
   const Component = (props: Props) => {
     // 実装
     return (
       // JSX
     );
   };

   // 3. エクスポート
   export { Component as AwesomeComponent };

   // 4. プライベートコンポーネント（必要な場合）
   const PrivateComponent = () => {
     // 実装
   };
   ```

2. **コンポーネントのファイル構成**
   - `index.tsx`: メインコンポーネント
   - `collection.tsx`: コンポーネントバリアント（必要な場合）

## データアクセスのルール

1. **リポジトリの構造**
   ```typescript
   // 1. 必要なインポート
   import { DomainEntity } from 'common/domains/domain.entity';
   import { hcClient } from 'front/api-client/hc.api-client';
   
   const client = hcClient();
   
   // 2. 必要に応じてリクエスト型をエクスポート
   export type GetDomainRequest = InferRequestType<(typeof client.domains)[':id']['$get']>;
   
   // 3. 各メソッドを個別の関数として定義
   const get = async (id: string): Promise<DomainEntity> => {
     // 実装
   };
   
   const create = async (data: Omit<DomainEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DomainEntity> => {
     // 実装
   };
   
   // 4. リポジトリをオブジェクトとしてエクスポート
   export const domainRepository = { get, create };
   ```

2. **リソースフックの構造**
   ```typescript
   // 1. 必要なインポート
   import { DomainEntity } from 'common/domains/domain.entity';
   import { domainRepository } from 'front/repositories/domain.repository';
   import { useEffect, useState } from 'react';
   import useSWR from 'swr';
   
   // 2. 単一の関数としてフックを実装
   export const useDomain = (id: string) => {
     // ローカルステートの定義
     const [errorType, setErrorType] = useState<string | undefined>();
     
     // SWRを使用してデータをフェッチ
     const { data, error, isLoading, mutate } = useSWR<DomainEntity>(
       [`domainDocument`, id],
       async () => {
         return await domainRepository.get(id);
       }
     );
     
     // エラーハンドリング
     useEffect(() => {
       // エラー処理
     }, [error]);
     
     // ミューテーション操作の定義
     const updateDomain = async (updateData: Partial<Omit<DomainEntity, 'id' | 'createdAt' | 'updatedAt'>>) => {
       const response = await domainRepository.update(id, updateData);
       // キャッシュを更新
       mutate();
       return response;
     };
     
     // 3. フックの戻り値
     return {
       domain: data,
       domainError: error,
       domainIsLoading: isLoading,
       domainErrorType: errorType,
       updateDomain,
     };
   };
   ```

## 実際のファイルを参照

各モジュールタイプの実装例については、以下のファイルを参照してください：

- コンポーネント: `front/components/04_screens/SUserShowScreen/index.tsx`
- リポジトリ: `front/repositories/prompt.repository.ts`
- リソースフック: `front/hooks/resources/useUser.ts`

これらのファイルは、上記のルールに従って実装されており、新しいコードを書く際の参考になります。

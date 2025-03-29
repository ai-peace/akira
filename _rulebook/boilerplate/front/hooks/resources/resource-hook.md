# リソースフックのボイラープレート

## 目的
このファイルは、特定のドメインエンティティに対するデータフェッチングと
キャッシングを提供するリソースフックを定義します。SWRを使用して、
自動的なデータ再検証とキャッシュ管理を行います。

## 配置場所
`front/hooks/resources/use{ResourceName}.ts` または `front/hooks/resources/use{Action}{ResourceName}.ts`

## ルール
1. ファイル名は `use{ResourceName}.ts` または `use{Action}{ResourceName}.ts` とする
2. 対応するリポジトリをインポートする
3. SWRを使用してデータフェッチングとキャッシングを実装する
4. 単一の関数としてフックを実装し、必要なパラメータを受け取る
5. エラーハンドリングを適切に実装する
6. 型安全性を確保する
7. ミューテーション操作（作成、更新、削除など）は同じフック内に含める
8. SWRの `mutate` 関数を使用してキャッシュを更新する

## 実装例

```typescript
import { {DomainName}Entity } from 'common/domains/{domain-name}.entity';
import { {domainName}Repository } from 'front/repositories/{domain-name}.repository';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

/**
 * {DomainName}リソースを管理するためのフック
 * @param id 取得する{DomainName}のID
 */
export const use{DomainName} = (id: string) => {
  // エラータイプの状態管理
  const [errorType, setErrorType] = useState<string | undefined>();

  // SWRを使用してデータをフェッチ
  const { data, error, isLoading, mutate } = useSWR<{DomainName}Entity>(
    [`{domainName}Document`, id],
    async () => {
      return await {domainName}Repository.get(id);
    }
  );

  // エラーハンドリング
  useEffect(() => {
    if (!error) return;
    if (`${error}`.includes('NotFoundError')) {
      setErrorType('NotFoundError');
    } else {
      setErrorType(`UnknownError ${error}`);
    }
  }, [error]);

  /**
   * {DomainName}を更新する
   * @param updateData 更新データ
   */
  const update{DomainName} = async (updateData: Partial<Omit<{DomainName}Entity, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const response = await {domainName}Repository.update(id, updateData);
    // キャッシュを更新
    mutate();
    return response;
  };

  /**
   * {DomainName}に関連するアイテムを作成する
   * @param data 作成データ
   */
  const create{DomainName}Item = async (data: { name: string; description?: string }) => {
    const response = await {domainName}Repository.createItem(id, data);
    // キャッシュを更新
    mutate();
    return response;
  };

  /**
   * {DomainName}を削除する
   */
  const delete{DomainName} = async () => {
    const success = await {domainName}Repository.remove(id);
    // キャッシュを更新
    if (success) {
      mutate(undefined, false);
    }
    return success;
  };

  // フックの戻り値
  return {
    {domainName}: data,
    {domainName}Error: error,
    {domainName}IsLoading: isLoading,
    {domainName}ErrorType: errorType,
    update{DomainName},
    create{DomainName}Item,
    delete{DomainName},
  };
};
```

## 使用例

```typescript
// useUser.ts
import { UserEntity } from 'common/domains/user.entity';
import { userRepository } from 'front/repositories/user.repository';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

export const useUser = (uniqueKey: string) => {
  const [errorType, setErrorType] = useState<string | undefined>();

  const { data, error, isLoading, mutate } = useSWR<UserEntity>(
    [`userDocument`, uniqueKey],
    async () => {
      return await userRepository.get(uniqueKey);
    }
  );

  useEffect(() => {
    if (!error) return;
    if (`${error}`.includes('NotFoundError')) {
      setErrorType('NotFoundError');
    } else {
      setErrorType(`UnknownError ${error}`);
    }
  }, [error]);

  // ユーザーに関連するプロンプトを作成する
  const createUserPrompt = async (content: string) => {
    const response = await userRepository.createPrompt({ uniqueKey }, { content });
    // キャッシュを更新
    mutate();
    return response;
  };

  return {
    user: data,
    userError: error,
    userIsLoading: isLoading,
    userErrorType: errorType,
    createUserPrompt,
  };
};
```

## リスト取得の例

```typescript
// useUsers.ts
import { UserEntity } from 'common/domains/user.entity';
import { userRepository } from 'front/repositories/user.repository';
import { useState } from 'react';
import useSWR from 'swr';

export const useUsers = (params?: { page?: number; limit?: number }) => {
  const [page, setPage] = useState(params?.page || 1);
  const [limit, setLimit] = useState(params?.limit || 10);

  const { data, error, isLoading, mutate } = useSWR<UserEntity[]>(
    [`usersList`, page, limit],
    async () => {
      return await userRepository.list({ page, limit });
    }
  );

  const nextPage = () => {
    setPage(prev => prev + 1);
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  return {
    users: data || [],
    usersError: error,
    usersIsLoading: isLoading,
    page,
    limit,
    nextPage,
    prevPage,
    mutate,
  };
};

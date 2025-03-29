# オンライン/オフライン対応リポジトリパターン

このドキュメントでは、IndexedDBを使用したオンライン/オフライン対応リポジトリパターンの実装方法について説明します。このパターンは、ネットワーク接続の有無に関わらずアプリケーションを使用可能にするために重要です。

## 概要

オンライン/オフライン対応リポジトリパターンは以下の目的で実装されます：

1. **オフライン対応**: ネットワーク接続がない状態でもアプリケーションを使用可能にする
2. **パフォーマンス向上**: サーバーへのリクエスト回数を減らし、レスポンス時間を短縮する
3. **データの永続化**: ブラウザを閉じても、ユーザーのデータを保持する
4. **ネットワーク帯域の節約**: 必要なデータのみをサーバーと同期する

## リポジトリパターンの実装

### 基本的なリポジトリ

シンプルなエンティティに対するリポジトリの例：

```typescript
// repository/simple-entity.repository.ts
import { SimpleEntity } from '@/domains/entities/simple-entity'
import { getIndexedDB } from '@/lib/indexed-db'

const STORE_KEY = 'default' // 単一インスタンスの場合

const get = async (): Promise<SimpleEntity | null> => {
  const db = await getIndexedDB()
  const data = await db.get('simple-entity', STORE_KEY)
  return data as SimpleEntity | null
}

const save = async (entity: SimpleEntity) => {
  const db = await getIndexedDB()
  const dataToSave = {
    ...entity,
    id: STORE_KEY,
  }
  await db.put('simple-entity', dataToSave)
}

const destroy = async () => {
  const db = await getIndexedDB()
  await db.delete('simple-entity', STORE_KEY)
}

export const simpleEntityRepository = { get, save, destroy }
```

### オンライン/オフライン対応リポジトリ

オンラインとオフラインの両方に対応したリポジトリの例：

```typescript
// repository/complex-entity.repository.ts
import { hcClient } from '@/api-client/hc.api-client'
import { ComplexEntity } from '@/domains/entities/complex-entity'
import { getIndexedDB } from '@/lib/indexed-db'
import type { InferRequestType } from 'hono/client'

// 型定義
const client = hcClient()
export type CreateComplexEntityInput = InferRequestType<(typeof client.entities)['$post']>
export type UpdateComplexEntityInput = InferRequestType<
  (typeof client.entities)[':uniqueKey']['$patch']
>

// 戦略の型定義
export type FetchStrategy = {
  mode: 'online-first' | 'offline-first' | 'version-compare' | 'online-only' | 'offline-only'
  forceRefresh?: boolean
}

export type SaveStrategy = {
  mode: 'online-only' | 'offline-only' | 'both'
}

// エンティティ変換関数
const convertToEntity = (data: any): ComplexEntity => ({
  ...data,
  updatedAt: new Date(data.updatedAt),
  createdAt: new Date(data.createdAt),
})

// オンラインリポジトリ
const onlineRepository = {
  collection: async (): Promise<ComplexEntity[]> => {
    try {
      const client = hcClient()
      const res = await client.entities.$get()
      const json = await res.json()
      return 'data' in json ? json.data.map(convertToEntity) : []
    } catch (error) {
      console.error('Error fetching entities:', error)
      throw error
    }
  },

  get: async (uniqueKey: string): Promise<ComplexEntity | null> => {
    try {
      const client = hcClient()
      const res = await client.entities[':uniqueKey'].$get({ param: { uniqueKey } })
      const json = await res.json()
      return 'data' in json ? convertToEntity(json.data) : null
    } catch (error) {
      console.error('Error fetching entity:', error)
      throw error
    }
  },

  create: async (input: CreateComplexEntityInput): Promise<ComplexEntity> => {
    try {
      const client = hcClient()
      const res = await client.entities.$post({ json: input.json })
      const json = await res.json()
      if (!('data' in json)) throw new Error('Failed to create entity')
      return convertToEntity(json.data)
    } catch (error) {
      console.error('Error creating entity:', error)
      throw error
    }
  },

  update: async (input: UpdateComplexEntityInput): Promise<ComplexEntity> => {
    try {
      const client = hcClient()
      const res = await client.entities[':uniqueKey']['$patch']({
        param: { uniqueKey: input.param.uniqueKey },
        json: input.json,
      })
      const json = await res.json()
      if (!('data' in json)) throw new Error('Failed to update entity')
      return convertToEntity(json.data)
    } catch (error) {
      console.error('Error updating entity:', error)
      throw error
    }
  },
}

// オフラインリポジトリ
const offlineRepository = {
  get: async (uniqueKey: string): Promise<ComplexEntity | null> => {
    const db = await getIndexedDB()
    const data = await db.get('complex-entities', uniqueKey)
    return data
  },

  save: async (uniqueKey: string, entity: ComplexEntity): Promise<void> => {
    const db = await getIndexedDB()
    const entityToSave = {
      ...entity,
      uniqueKey,
    }

    await db.put('complex-entities', entityToSave)
  },

  delete: async (uniqueKey: string): Promise<void> => {
    const db = await getIndexedDB()
    await db.delete('complex-entities', uniqueKey)
  },
}

// メインリポジトリ
export const complexEntityRepository = {
  collection: async (): Promise<ComplexEntity[]> => {
    return await onlineRepository.collection()
  },

  get: async (
    uniqueKey: string,
    strategy: FetchStrategy = { mode: 'version-compare' },
  ): Promise<ComplexEntity | null> => {
    switch (strategy.mode) {
      case 'online-first':
        try {
          const onlineEntity = await onlineRepository.get(uniqueKey)
          if (onlineEntity) {
            await offlineRepository.save(uniqueKey, onlineEntity)
            return onlineEntity
          }
          return await offlineRepository.get(uniqueKey)
        } catch (error) {
          return await offlineRepository.get(uniqueKey)
        }

      case 'offline-first':
        try {
          const offlineEntity = await offlineRepository.get(uniqueKey)
          if (offlineEntity) return offlineEntity

          const onlineEntity = await onlineRepository.get(uniqueKey)
          if (onlineEntity) {
            await offlineRepository.save(uniqueKey, onlineEntity)
          }
          return onlineEntity
        } catch {
          return null
        }

      case 'version-compare':
        try {
          const [offlineEntity, onlineEntity] = await Promise.all([
            offlineRepository.get(uniqueKey),
            onlineRepository.get(uniqueKey).catch(() => null),
          ])

          if (!offlineEntity && !onlineEntity) return null
          if (!offlineEntity) return onlineEntity
          if (!onlineEntity) return offlineEntity

          const isOnlineNewer = new Date(onlineEntity.updatedAt) > new Date(offlineEntity.updatedAt)
          const latestEntity = isOnlineNewer ? onlineEntity : offlineEntity

          if (isOnlineNewer) {
            await offlineRepository.save(uniqueKey, onlineEntity)
          }

          return latestEntity
        } catch {
          return await offlineRepository.get(uniqueKey)
        }

      case 'online-only':
        return await onlineRepository.get(uniqueKey)

      case 'offline-only':
        return await offlineRepository.get(uniqueKey)
    }
  },

  create: async (
    input: CreateComplexEntityInput,
    strategy: SaveStrategy = { mode: 'online-only' },
  ): Promise<ComplexEntity> => {
    switch (strategy.mode) {
      case 'online-only':
        return await onlineRepository.create(input)

      case 'offline-only':
        const offlineEntity: ComplexEntity = {
          ...input.json,
          uniqueKey: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await offlineRepository.save(offlineEntity.uniqueKey, offlineEntity)
        return offlineEntity

      case 'both':
        const entity = await onlineRepository.create(input)
        await offlineRepository.save(entity.uniqueKey, entity)
        return entity
    }
  },

  update: async (
    input: UpdateComplexEntityInput,
    strategy: SaveStrategy = { mode: 'online-only' },
  ): Promise<ComplexEntity> => {
    switch (strategy.mode) {
      case 'online-only':
        return await onlineRepository.update(input)

      case 'offline-only':
        const currentEntity = await offlineRepository.get(input.param.uniqueKey)
        if (!currentEntity) throw new Error('Entity not found in offline storage')

        const updatedEntity: ComplexEntity = {
          ...currentEntity,
          ...input.json,
          updatedAt: new Date(),
        }

        await offlineRepository.save(updatedEntity.uniqueKey, updatedEntity)
        return updatedEntity

      case 'both':
        const entity = await onlineRepository.update(input)
        await offlineRepository.save(entity.uniqueKey, entity)
        return entity
    }
  },

  upsert: async (
    input: CreateComplexEntityInput | UpdateComplexEntityInput,
    strategy: SaveStrategy = { mode: 'both' },
  ): Promise<ComplexEntity> => {
    const isUpdate = 'param' in input

    switch (strategy.mode) {
      case 'online-only':
        return isUpdate
          ? await onlineRepository.update(input as UpdateComplexEntityInput)
          : await onlineRepository.create(input as CreateComplexEntityInput)

      case 'offline-only':
        if (isUpdate) {
          const uniqueKey = (input as UpdateComplexEntityInput).param.uniqueKey
          const currentEntity = await offlineRepository.get(uniqueKey)

          const updatedEntity: ComplexEntity = currentEntity
            ? {
                ...currentEntity,
                ...input.json,
                updatedAt: new Date(),
              }
            : {
                ...input.json,
                uniqueKey,
                createdAt: new Date(),
                updatedAt: new Date(),
              }

          await offlineRepository.save(updatedEntity.uniqueKey, updatedEntity)
          return updatedEntity
        } else {
          const newEntity: ComplexEntity = {
            ...input.json,
            uniqueKey: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          await offlineRepository.save(newEntity.uniqueKey, newEntity)
          return newEntity
        }

      case 'both':
        try {
          const entity = isUpdate
            ? await onlineRepository.update(input as UpdateComplexEntityInput)
            : await onlineRepository.create(input as CreateComplexEntityInput)
          await offlineRepository.save(entity.uniqueKey, entity)
          return entity
        } catch (error) {
          // オンライン保存に失敗した場合、オフラインに保存
          console.warn('Failed to save online, falling back to offline storage:', error)
          return await complexEntityRepository.upsert(input, { mode: 'offline-only' })
        }
    }
  },
}
```

## キャッシュ戦略の種類

### データ取得戦略（FetchStrategy）

1. **online-first**: オンラインからデータを取得し、失敗した場合はオフラインから取得
2. **offline-first**: オフラインからデータを取得し、存在しない場合はオンラインから取得
3. **version-compare**: オンラインとオフラインの両方からデータを取得し、最新のものを使用
4. **online-only**: オンラインからのみデータを取得
5. **offline-only**: オフラインからのみデータを取得

### データ保存戦略（SaveStrategy）

1. **online-only**: オンラインにのみデータを保存
2. **offline-only**: オフラインにのみデータを保存
3. **both**: オンラインとオフラインの両方にデータを保存（オンラインに失敗した場合はオフラインにフォールバック）

## Reactフックでの使用例

```typescript
// hooks/useComplexEntity.ts
import { ComplexEntity } from '@/domains/entities/complex-entity'
import {
  FetchStrategy,
  SaveStrategy,
  complexEntityRepository,
} from '@/repository/complex-entity.repository'
import { useCallback, useEffect, useState } from 'react'

export const useComplexEntity = (
  uniqueKey: string,
  initialStrategy: FetchStrategy = { mode: 'version-compare' },
) => {
  const [entity, setEntity] = useState<ComplexEntity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchEntity = useCallback(
    async (strategy: FetchStrategy = initialStrategy) => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await complexEntityRepository.get(uniqueKey, strategy)
        setEntity(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    },
    [uniqueKey, initialStrategy],
  )

  const updateEntity = useCallback(
    async (data: Partial<ComplexEntity>, strategy: SaveStrategy = { mode: 'both' }) => {
      if (!entity) return null

      setIsLoading(true)
      setError(null)
      try {
        const updatedEntity = await complexEntityRepository.update(
          {
            param: { uniqueKey },
            json: data,
          },
          strategy,
        )
        setEntity(updatedEntity)
        return updatedEntity
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [uniqueKey, entity],
  )

  useEffect(() => {
    fetchEntity()
  }, [fetchEntity])

  return {
    entity,
    isLoading,
    error,
    fetchEntity,
    updateEntity,
  }
}
```

## オフライン対応のベストプラクティス

1. **ネットワーク状態の監視**:

   ```typescript
   window.addEventListener('online', handleOnline)
   window.addEventListener('offline', handleOffline)
   ```

2. **同期キュー**:
   オフライン時に変更をキューに入れ、オンラインに戻ったときに同期する

3. **コンフリクト解決**:
   オンラインとオフラインの両方で変更があった場合の解決戦略を実装する

4. **エラーハンドリング**:
   オフライン操作とオンライン同期の両方でエラーを適切に処理する

5. **ユーザーへのフィードバック**:
   オフライン状態やデータの同期状態をユーザーに通知する

## 実装手順

1. **IndexedDBの設定**:
   `lib/indexed-db.ts`ファイルを作成し、データベースとストアを設定

2. **リポジトリの実装**:
   エンティティごとにリポジトリを実装し、オンライン/オフラインの戦略を定義

3. **Reactフックの作成**:
   リポジトリを使用するReactフックを作成し、UIコンポーネントで使用

4. **オフライン対応の強化**:
   ネットワーク状態の監視や同期キューなどの機能を追加

## 注意点

1. **ストレージ容量**:
   IndexedDBのストレージ容量は制限があるため、大量のデータを保存する場合は注意が必要

2. **セキュリティ**:
   機密データをローカルに保存する場合は、適切な暗号化を検討する

3. **バージョン管理**:
   スキーマを変更する場合は、適切なマイグレーション戦略を実装する

4. **ブラウザ互換性**:
   古いブラウザではIndexedDBがサポートされていない場合があるため、フォールバックを検討する

5. **テスト**:
   オンライン/オフラインの両方のシナリオをテストする

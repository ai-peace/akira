# IndexedDBの設定と使用方法

このドキュメントでは、IndexedDBを使用したローカルデータベースの設定と基本的な使用方法について説明します。IndexedDBは、ブラウザ上で大量のデータを永続的に保存するためのAPIです。

## 概要

IndexedDBは以下の特徴を持っています：

1. **非同期API**: すべての操作は非同期で行われ、メインスレッドをブロックしません
2. **トランザクションベース**: データの整合性を保証するためのトランザクションをサポート
3. **キーバリューストア**: シンプルなキーバリューストアとして使用可能
4. **インデックス**: 効率的な検索のためのインデックスをサポート
5. **大容量データ**: 大量のデータを保存可能（ブラウザによって制限は異なる）

## 基本設定

### 依存関係のインストール

IndexedDBを簡単に扱うために、`idb`ライブラリを使用することをお勧めします：

```bash
pnpm add idb
```

### データベースの初期化

```typescript
// lib/indexed-db.ts
import { IDBPDatabase, openDB } from 'idb'

const DB_NAME = 'your-app-name'
const DB_VERSION = 1

const STORE_NAMES = {
  ENTITY_1: 'entity-1',
  ENTITY_2: 'entity-2',
  // 必要に応じて追加
} as const

let dbInstance: IDBPDatabase | null = null

const initDB = async () => {
  const database = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      // 各エンティティのストアを作成
      if (!db.objectStoreNames.contains(STORE_NAMES.ENTITY_1)) {
        db.createObjectStore(STORE_NAMES.ENTITY_1, {
          keyPath: 'uniqueKey', // プライマリキーとなるフィールド
        })
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.ENTITY_2)) {
        db.createObjectStore(STORE_NAMES.ENTITY_2, {
          keyPath: 'id',
        })
      }
    },
  })

  return database
}

export const getIndexedDB = async () => {
  if (dbInstance) return dbInstance

  dbInstance = await initDB()

  return dbInstance
}
```

## 基本的な操作

### データの取得

```typescript
const getData = async (storeName: string, key: string) => {
  const db = await getIndexedDB()
  return await db.get(storeName, key)
}
```

### データの保存

```typescript
const saveData = async (storeName: string, data: any) => {
  const db = await getIndexedDB()
  await db.put(storeName, data)
}
```

### データの削除

```typescript
const deleteData = async (storeName: string, key: string) => {
  const db = await getIndexedDB()
  await db.delete(storeName, key)
}
```

### 全データの取得

```typescript
const getAllData = async (storeName: string) => {
  const db = await getIndexedDB()
  return await db.getAll(storeName)
}
```

## 高度な使用方法

### トランザクションの使用

```typescript
const performTransaction = async () => {
  const db = await getIndexedDB()
  const tx = db.transaction(['store1', 'store2'], 'readwrite')

  await Promise.all([
    tx.objectStore('store1').put({ id: 1, value: 'value1' }),
    tx.objectStore('store2').put({ id: 1, value: 'value2' }),
    tx.done,
  ])
}
```

### インデックスの作成と使用

```typescript
// インデックスの作成（upgrade関数内）
db.createObjectStore('users', { keyPath: 'id' }).createIndex('by-name', 'name')

// インデックスを使用したデータ取得
const getUserByName = async (name: string) => {
  const db = await getIndexedDB()
  return await db.getAllFromIndex('users', 'by-name', name)
}
```

## 使用上の注意点

1. **バージョン管理**:
   スキーマを変更する場合は、`DB_VERSION`を増やす必要があります。これにより、`upgrade`関数が呼び出され、スキーマの更新が行われます。

2. **キーパス**:
   各ストアには一意のキーパスが必要です。これは、オブジェクトのプロパティ名であり、そのプロパティの値がプライマリキーとして使用されます。

3. **シングルトンパターン**:
   `getIndexedDB`関数はシングルトンパターンを使用して、データベースインスタンスを再利用します。これにより、パフォーマンスが向上します。

4. **エラーハンドリング**:
   IndexedDBの操作は非同期であり、エラーが発生する可能性があります。適切なエラーハンドリングを実装することが重要です。

5. **ストレージ制限**:
   ブラウザによってストレージの制限が異なります。大量のデータを保存する場合は、ストレージの制限を考慮する必要があります。

## リポジトリパターンとの統合

IndexedDBを使用したデータアクセスは、リポジトリパターンと組み合わせることで、より構造化されたアプローチが可能になります。詳細については、`repository-with-offline.md`を参照してください。

## 参考リソース

- [MDN Web Docs: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [idb: IndexedDBのPromiseラッパー](https://github.com/jakearchibald/idb)
- [IndexedDB の使用](https://developer.mozilla.org/ja/docs/Web/API/IndexedDB_API/Using_IndexedDB)

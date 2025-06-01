# Seed Data Configuration

このディレクトリには、アプリケーションで使用される各種設定ファイルが含まれています。

## 📁 設定ファイル

### 🏛️ コレクション設定

- **ファイル**: `collections.json`
- **用途**: コレクション初期化用のシード データ

### 🎨 RWA NFT ミント設定

#### 🔧 デフォルト設定

- **ファイル**: `mint_rwa_collection_nft.json`
- **用途**: 引数なしでスクリプトを実行した際に使用される

#### 🎯 カスタム設定

- **ファイル**: `mint_rwa_custom.json` (例)
- **用途**: カスタム設定でミントする際に使用

### 👨‍💼 管理者アクション設定

- **ファイル**: `admin_actions.json`
- **用途**: NFT 交換、緊急ロック、URI 更新の設定

## 🚀 使用方法

### RWA Collection NFT ミント

#### デフォルト設定でミント

```bash
pnpm tsx scripts/03_mint/01_mint_rwa_collection_nft.ts
```

#### カスタム設定ファイルでミント

```bash
pnpm tsx scripts/03_mint/01_mint_rwa_collection_nft.ts scripts/seed/your_custom_config.json
```

### 👨‍💼 管理者アクション

#### NFT 交換（物理資産の交換時）

```bash
pnpm tsx scripts/01_admin/06_exchange_nft.ts <nft_mint> <collection_seed>
```

#### 緊急ロック（グローバル管理者のみ）

```bash
pnpm tsx scripts/01_admin/07_admin_lock_nft.ts <nft_mint> "<reason>"
```

#### URI 更新（コレクション管理者のみ）

```bash
pnpm tsx scripts/01_admin/08_update_rwa_uri.ts <nft_mint> <collection_seed> "<new_uri>"
```

## 📋 設定ファイル形式

### RWA NFT ミント設定

```json
{
  "requestId": "your-request-id",
  "collectionSeed": "collection-seed",
  "nftName": "Your NFT Name",
  "nftSymbol": "SYMBOL",
  "nftUri": "https://arweave.net/your-metadata-hash",
  "description": "Optional description of your NFT"
}
```

#### 必須フィールド

- `requestId`: 購入リクエスト ID（事前に作成済みである必要があります）
- `collectionSeed`: コレクションのシード（事前に初期化済みである必要があります）
- `nftName`: NFT の名前
- `nftSymbol`: NFT のシンボル
- `nftUri`: NFT のメタデータ URI

#### オプションフィールド

- `description`: NFT の説明（表示のみ）

### コレクション設定

```json
{
  "collection-key": {
    "name": "Collection Name",
    "symbol": "SYMBOL",
    "uri": "https://collection-metadata-uri.com",
    "sellerFeeBasisPoints": 750,
    "seed": "collection-seed"
  }
}
```

## ⚠️ 前提条件

ミント実行前に以下の手順を完了している必要があります：

1. **グローバル設定の初期化**

   ```bash
   pnpm tsx scripts/01_admin/01_initialize_global_config.ts
   ```

2. **コレクションの初期化**

   ```bash
   pnpm tsx scripts/01_admin/02_initialize_collection.ts
   ```

3. **購入リクエストの作成**

   ```bash
   pnpm tsx scripts/02_deposit/01_create_purchase_request.ts <request_id> <metadata_uri> <price_estimate>
   ```

4. **資金のデポジット**

   ```bash
   pnpm tsx scripts/02_deposit/02_deposit_funds.ts <request_id> <amount>
   ```

5. **資金調達状況の確認**
   ```bash
   pnpm tsx scripts/02_deposit/04_is_purchase_request_funded.ts <request_id>
   ```

### 💎 購入リクエスト管理

#### PDA 検索

```bash
pnpm tsx scripts/02_deposit/05_find_purchase_request.ts <owner_address> <request_id>
```

#### リクエスト詳細取得

```bash
pnpm tsx scripts/02_deposit/03_get_purchase_request_by_id.ts <request_id>
```

## 🏛️ 物理資産管理

RWA Collection NFT は以下の特徴を持ちます：

- **Freeze Authority**: コレクション管理者（物理資産管理者）
- **Exchange Function**: 物理資産交換時に NFT をフリーズ可能
- **Admin Lock**: 緊急時のグローバル管理者ロック機能

## 🔗 Explorer Links

ミント成功後、以下のリンクが自動生成されます：

- トランザクション詳細
- NFT Mint アドレス
- RWA State アドレス
- Token Account アドレス

## 💡 ヒント

- リクエスト ID は一意である必要があります
- URI には有効なメタデータ JSON を指す URL を使用してください
- コレクションは事前に初期化されている必要があります
- 十分な資金がデポジットされている必要があります

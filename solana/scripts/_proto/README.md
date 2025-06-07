# 📂 Scripts フォルダー構成

現在のワークフロー（**Option A: 事前フリーズアーキテクチャ**）に対応した、整理されたスクリプト構成です。

## 🗂️ フォルダー構造

```
scripts/
├── 01_admin/           # 管理者権限が必要な機能
│   ├── 01_config/      # グローバル設定関連
│   ├── 02_collection/  # コレクション管理
│   ├── 03_purchase/    # 購入関連（管理者権限）
│   ├── 04_exchange/    # Exchange関連（管理者権限）
│   └── 05_nft/         # NFT管理
├── 02_user/            # ユーザー権限で実行可能
│   ├── 01_purchase/    # 購入関連（ユーザー権限）
│   └── 02_exchange/    # Exchange関連（ユーザー権限）
└── 03_test/            # テスト・検証用
```

## 📋 **管理者権限スクリプト** (`scripts/01_admin/`)

### 01_config/ - グローバル設定

- `01_initialize_global_config.ts` - グローバル設定の初期化
- `02_get_global_config.ts` - グローバル設定の取得
- `03_update_deposit_target.ts` - デポジット先アカウントの更新

### 02_collection/ - コレクション管理

- `01_initialize_collection.ts` - NFT コレクションの初期化
- `02_update_collection.ts` - コレクション情報の更新

### 03_purchase/ - 購入関連（管理者権限）

- `01_create_purchase_request.ts` - 購入リクエストの作成
- `02_refund_purchase_request.ts` - 購入代金の返金処理

### 04_exchange/ - Exchange 関連（管理者権限）

- `01_create_exchange_with_freeze.ts` - **Exchange Request 作成 + 即座フリーズ**

### 05_nft/ - NFT 管理

- `01_mint_rwa_collection_nft.ts` - RWA 対応コレクション NFT のミント
- `02_admin_lock_nft.ts` - 管理者による緊急 NFT ロック
- `03_update_rwa_uri.ts` - NFT URI の更新

## 👤 **ユーザー権限スクリプト** (`scripts/02_user/`)

### 01_purchase/ - 購入関連（ユーザー権限）

- `01_deposit_funds.ts` - 購入代金のデポジット
- `02_get_purchase_request_by_id.ts` - 購入リクエストの取得
- `03_is_purchase_request_funded.ts` - 購入リクエストの支払い状況確認
- `04_find_purchase_request.ts` - 購入リクエストの検索

### 02_exchange/ - Exchange 関連（ユーザー権限）

- `01_deposit_shipping_fee.ts` - **送料のデポジット**

## 🧪 **テスト・検証用** (`scripts/03_test/`)

- `01_test_exchange_funded.ts` - Exchange funded check 機能のテスト
- `02_test_existing_exchange_funded.ts` - 既存 Exchange Request でのテスト
- `03_find_and_test_exchange_funded.ts` - Exchange Request 探索＆テスト

## 🎯 **ワークフロー実行順序**

### **Exchange Workflow**

1. **管理者**: `01_admin/04_exchange/01_create_exchange_with_freeze.ts`
   - Exchange Request 作成 + NFT 即座フリーズ
2. **ユーザー**: `02_user/02_exchange/01_deposit_shipping_fee.ts`
   - 送料デポジット
3. **システム**: プログラムの`is_exchange_request_funded`で支払い状況確認
4. **管理者**: 発送処理・完了

### **Purchase Workflow**

1. **管理者**: `01_admin/03_purchase/01_create_purchase_request.ts`
   - 購入リクエスト作成
2. **ユーザー**: `02_user/01_purchase/01_deposit_funds.ts`
   - 購入代金デポジット
3. **ユーザー**: `02_user/01_purchase/03_is_purchase_request_funded.ts`
   - 支払い状況確認
4. **管理者**: NFT ミント・配布

## 🔧 **プログラム機能**

### Exchange System（事前フリーズアーキテクチャ）

- `create_exchange_request_with_freeze` - Request 作成+即座物理フリーズ
- `deposit_shipping_fee` - 送料デポジット
- `is_exchange_request_funded` - **新機能!** 支払い状況確認
- `thaw_nft_conditional` - 条件未達時の NFT フリーズ解除
- `refund_exchange_request` - 返金処理

### Purchase System

- `create_purchase_request` - 購入リクエスト作成
- `deposit_funds` - 購入代金デポジット
- `is_purchase_request_funded` - 支払い状況確認
- `refund_purchase_request` - 返金処理

### NFT Management

- `mint_rwa_collection_nft` - RWA 対応 NFT ミント
- `admin_lock_nft` - 管理者緊急ロック
- `update_rwa_uri` - URI 更新

## 💡 **使用方法**

各スクリプトは以下のように実行します：

```bash
# 管理者権限が必要な場合
npx tsx scripts/01_admin/04_exchange/01_create_exchange_with_freeze.ts <パラメータ>

# ユーザー権限で実行可能
npx tsx scripts/02_user/02_exchange/01_deposit_shipping_fee.ts <パラメータ>

# テスト・検証
npx tsx scripts/03_test/03_find_and_test_exchange_funded.ts
```

## 🎉 整理完了！

- ✅ **権限別整理**: 管理者権限とユーザー権限で明確に分離
- ✅ **機能別整理**: 各機能ごとに番号付きフォルダで整理
- ✅ **ワークフロー順**: 実行順序に対応した番号付け
- ✅ **古いコード削除**: 旧ワークフローのファイルを完全削除

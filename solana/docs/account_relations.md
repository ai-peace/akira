# Akira Solana RWA システム - アカウント関係図

## 外部プログラム含む完全なアカウントリレーション図

```mermaid
erDiagram
    %% ========================================
    %% Akira Program Accounts (Internal)
    %% ========================================

    AKIRA_GlobalConfig {
        pubkey admin
        pubkey deposit_target
        string PDA_seeds "config"
    }

    AKIRA_CollectionConfig {
        pubkey authority
        pubkey collection_mint
        pubkey collection_metadata
        pubkey collection_master_edition
        string name
        string symbol
        string uri
        u16 seller_fee_basis_points
        string PDA_seeds "collection_config + collection_seed"
    }

    AKIRA_PurchaseRequest {
        pubkey owner
        string request_id
        string metadata_uri
        u64 price_estimate
        RequestStatus status
        u64 deposit_amount
        optional_pubkey rwa_mint
        optional_string purchase_confirmation
        optional_string storage_id
        i64 timestamp
        pubkey admin_authority
        optional_string cancellation_reason
        string PDA_seeds "purchase_request + owner + request_id"
    }

    AKIRA_RwaState {
        pubkey owner
        string uri
        bool is_exchangeable
        optional_i64 exchanged_at
        string PDA_seeds "rwa_state + mint"
    }

    %% ========================================
    %% SPL Token Program Accounts (External)
    %% ========================================

    EXT_SPL_Mint {
        u8 decimals
        pubkey mint_authority
        pubkey freeze_authority
        u64 supply
        string program "SPL Token Program"
    }

    EXT_SPL_TokenAccount {
        pubkey mint
        pubkey owner
        u64 amount
        bool is_frozen
        string program "SPL Token Program"
    }

    EXT_SPL_AssociatedTokenAccount {
        pubkey mint
        pubkey owner
        u64 amount
        string program "Associated Token Program"
        string PDA_seeds "owner + token_program + mint"
    }

    %% ========================================
    %% Metaplex Token Metadata Program (External)
    %% ========================================

    EXT_MPL_Metadata {
        string name
        string symbol
        string uri
        u16 seller_fee_basis_points
        array creators
        optional collection
        string program "Metaplex Token Metadata"
        string PDA_seeds "metadata + mpl_program + mint"
    }

    EXT_MPL_MasterEdition {
        optional_u64 max_supply
        u64 supply
        string program "Metaplex Token Metadata"
        string PDA_seeds "metadata + mpl_program + mint + edition"
    }

    EXT_MPL_CollectionMetadata {
        string name
        string symbol
        string uri
        u16 seller_fee_basis_points
        array creators
        string program "Metaplex Token Metadata"
        string PDA_seeds "metadata + mpl_program + collection_mint"
    }

    EXT_MPL_CollectionMasterEdition {
        optional_u64 max_supply
        u64 supply
        string program "Metaplex Token Metadata"
        string PDA_seeds "metadata + mpl_program + collection_mint + edition"
    }

    %% ========================================
    %% System Program Accounts (External)
    %% ========================================

    EXT_SYS_UserAccount {
        u64 lamports
        string program "System Program"
    }

    EXT_SYS_DepositAccount {
        u64 lamports
        string program "System Program"
    }

    %% ========================================
    %% リレーション関係
    %% ========================================

    %% Akira Program 内部関係
    AKIRA_GlobalConfig ||--o{ AKIRA_PurchaseRequest : "admin_authority"
    AKIRA_GlobalConfig ||--|| EXT_SYS_DepositAccount : "deposit_target"

    AKIRA_CollectionConfig ||--|| EXT_SPL_Mint : "collection_mint"
    AKIRA_CollectionConfig ||--|| EXT_MPL_CollectionMetadata : "collection_metadata"
    AKIRA_CollectionConfig ||--|| EXT_MPL_CollectionMasterEdition : "collection_master_edition"

    AKIRA_PurchaseRequest ||--|| AKIRA_RwaState : "creates"
    AKIRA_PurchaseRequest ||--o| EXT_SPL_Mint : "rwa_mint"
    AKIRA_PurchaseRequest ||--|| EXT_SYS_UserAccount : "owner"

    AKIRA_RwaState ||--|| EXT_SPL_Mint : "manages state"

    %% SPL Token関係
    EXT_SPL_Mint ||--o{ EXT_SPL_TokenAccount : "mint"
    EXT_SPL_Mint ||--o{ EXT_SPL_AssociatedTokenAccount : "mint"
    EXT_SPL_Mint ||--|| EXT_MPL_Metadata : "mint reference"
    EXT_SPL_Mint ||--|| EXT_MPL_MasterEdition : "mint reference"

    %% 権限関係
    AKIRA_CollectionConfig ||--|| EXT_SPL_Mint : "freeze_authority"
    EXT_SYS_UserAccount ||--o{ EXT_SPL_TokenAccount : "owner"
    EXT_SYS_UserAccount ||--o{ EXT_SPL_AssociatedTokenAccount : "owner"

    %% Collection関係
    EXT_MPL_Metadata ||--o| EXT_MPL_CollectionMetadata : "collection reference"

    %% 資金フロー
    EXT_SYS_UserAccount ||--|| EXT_SYS_DepositAccount : "deposit transfer"
```

## プログラム別アカウント分類

### 🏠 Akira Program (Internal)

- `AKIRA_GlobalConfig`: グローバル設定
- `AKIRA_CollectionConfig`: コレクション設定
- `AKIRA_PurchaseRequest`: 購入リクエスト
- `AKIRA_RwaState`: RWA 状態管理

### 🪙 SPL Token Program (External)

- `EXT_SPL_Mint`: トークンミント
- `EXT_SPL_TokenAccount`: トークンアカウント
- `EXT_SPL_AssociatedTokenAccount`: 関連トークンアカウント

### 🎨 Metaplex Token Metadata Program (External)

- `EXT_MPL_Metadata`: NFT メタデータ
- `EXT_MPL_MasterEdition`: マスターエディション
- `EXT_MPL_CollectionMetadata`: コレクションメタデータ
- `EXT_MPL_CollectionMasterEdition`: コレクションマスターエディション

### 🔧 System Program (External)

- `EXT_SYS_UserAccount`: ユーザーアカウント（SOL 保持）
- `EXT_SYS_DepositAccount`: デポジットアカウント（SOL 受取）

## PDA シード情報

### Akira Program PDAs

```
GlobalConfig: ["config"]
CollectionConfig: ["collection_config", collection_seed]
PurchaseRequest: ["purchase_request", owner, request_id]
RwaState: ["rwa_state", mint]
```

### External Program PDAs

```
Metadata: ["metadata", mpl_token_metadata::ID, mint]
MasterEdition: ["metadata", mpl_token_metadata::ID, mint, "edition"]
AssociatedTokenAccount: [owner, spl_token::ID, mint]
```

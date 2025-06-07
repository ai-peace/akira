use anchor_lang::prelude::*;

mod errors;
mod utils;
mod state;
mod instructions;


use state::*;
use instructions::*;

declare_id!("CY6qKVgEFq5yztnwq2ycf1hQAmuDnsaH62DCXMYgQJAK");

#[program]
pub mod akira_solana {
    use super::*;

    // ========== 設定管理 ==========
    
    /// グローバル設定の初期化
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        deposit_target: Pubkey,
    ) -> Result<()> {
        instructions::config::initialize_config(ctx, deposit_target)
    }

    /// 送付先更新命令（管理者のみ）
    pub fn update_deposit_target(
        ctx: Context<UpdateConfig>,
        new_deposit_target: Pubkey,
    ) -> Result<()> {
        instructions::config::update_deposit_target(ctx, new_deposit_target)
    }

    /// NFTコレクション初期化
    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        name: String,
        symbol: String,
        uri: String,
        seller_fee_basis_points: u16,
        collection_seed: String,
    ) -> Result<()> {
        instructions::config::initialize_collection(ctx, name, symbol, uri, seller_fee_basis_points, collection_seed)
    }

    /// 管理者のみコレクションを更新可能
    pub fn update_collection(
        ctx: Context<UpdateCollection>,
        collection_seed: String,
        new_name: Option<String>,
        new_symbol: Option<String>, 
        new_uri: Option<String>,
        new_seller_fee_basis_points: Option<u16>,
    ) -> Result<()> {
        instructions::config::update_collection(ctx, collection_seed, new_name, new_symbol, new_uri, new_seller_fee_basis_points)
    }

    // ========== 購入システム ==========

    /// 購入リクエストを作成（管理者のみ）
    pub fn create_purchase_request(
        ctx: Context<CreatePurchaseRequest>,
        target_user: Pubkey,
        request_id: String,
        metadata_uri: String,
        price_estimate: u64,
        deposit_token_type: DepositTokenType,
        deposit_token_mint: Option<Pubkey>,
    ) -> Result<()> {
        instructions::purchase::create_purchase_request(ctx, target_user, request_id, metadata_uri, price_estimate, deposit_token_type, deposit_token_mint)
    }

    /// 購入リクエストの返金処理（管理者のみ）
    pub fn refund_purchase_request(
        ctx: Context<RefundPurchaseRequest>,
        refund_reason: String,
    ) -> Result<()> {
        instructions::purchase::refund_purchase_request(ctx, refund_reason)
    }

    /// SOL/USDT/USDCデポジットを受け付ける
    pub fn deposit_funds(
        ctx: Context<DepositFunds>,
        amount: u64,
    ) -> Result<()> {
        instructions::purchase::deposit_funds(ctx, amount)
    }

    /// 購入リクエストが必要なデポジット額に達しているかを確認する
    pub fn is_purchase_request_funded(
        ctx: Context<CheckPurchaseRequestFunded>,
    ) -> Result<bool> {
        instructions::purchase::is_purchase_request_funded(ctx)
    }

    /// リクエストIDから購入リクエストを取得する
    pub fn get_purchase_request_by_id(
        ctx: Context<GetPurchaseRequestById>,
    ) -> Result<PurchaseRequest> {
        instructions::purchase::get_purchase_request_by_id(ctx)
    }

    /// オーナーとリクエストIDから購入リクエストPDAを検索する
    pub fn find_purchase_request(
        ctx: Context<FindPurchaseRequest>,
        owner: Pubkey,
        request_id: String,
    ) -> Result<Pubkey> {
        instructions::purchase::find_purchase_request(ctx, owner, request_id)
    }

    // ========== NFT管理 ==========

    /// RWA対応コレクション付きNFTミント（authority実行、target_userに配布）
    pub fn mint_rwa_collection_nft(
        ctx: Context<MintRwaCollectionNft>,
        collection_seed: String,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        instructions::nft::mint_rwa_collection_nft(ctx, collection_seed, name, symbol, uri)
    }



    /// 管理者緊急ロック機能（資産問題時の管理者ロック）
    pub fn admin_lock_nft(
        ctx: Context<AdminLockNft>,
        reason: String,
    ) -> Result<()> {
        instructions::nft::admin_lock_nft(ctx, reason)
    }

    /// URI更新機能（管理者のみ）
    pub fn update_rwa_uri(
        ctx: Context<UpdateRwaUri>,
        collection_seed: String,
        new_uri: String,
    ) -> Result<()> {
        instructions::nft::update_rwa_uri(ctx, collection_seed, new_uri)
    }

    // ========== 交換システム（Option A: 事前フリーズアーキテクチャ） ==========

    /// 送料デポジット - ユーザー実行
    pub fn deposit_shipping_fee(
        ctx: Context<DepositShippingFee>,
        deposit_amount: u64,
    ) -> Result<()> {
        instructions::exchange::deposit_shipping_fee(ctx, deposit_amount)
    }

    /// 交換リクエスト作成と即座の物理フリーズ（管理者のみ）
    pub fn create_exchange_request_with_freeze(
        ctx: Context<CreateExchangeRequestWithFreeze>,
        nft_owner: Pubkey,
        request_id: String,
        nft_mint: Pubkey,
        shipping_fee: u64,
        deposit_token_type: DepositTokenType,
        deposit_token_mint: Option<Pubkey>,
    ) -> Result<()> {
        instructions::exchange::create_exchange_request_with_freeze(
            ctx, nft_owner, request_id, nft_mint, shipping_fee, deposit_token_type, deposit_token_mint
        )
    }

    /// 条件未達成時のNFTフリーズ解除（管理者のみ）
    pub fn thaw_nft_conditional(
        ctx: Context<ThawNftConditional>,
        reason: String,
    ) -> Result<()> {
        instructions::exchange::thaw_nft_conditional(ctx, reason)
    }

    /// 交換リクエスト取得
    pub fn get_exchange_request_by_id(
        ctx: Context<GetExchangeRequestById>,
    ) -> Result<ExchangeRequest> {
        instructions::exchange::get_exchange_request_by_id(ctx)
    }

    /// 交換リクエストが必要なデポジット額に達しているかを確認する
    pub fn is_exchange_request_funded(
        ctx: Context<CheckExchangeRequestFunded>,
    ) -> Result<bool> {
        instructions::exchange::is_exchange_request_funded(ctx)
    }

    /// 交換リクエスト返金（管理者のみ）
    pub fn refund_exchange_request(
        ctx: Context<RefundExchangeRequest>,
        refund_reason: String,
    ) -> Result<()> {
        instructions::exchange::refund_exchange_request(ctx, refund_reason)
    }
} 
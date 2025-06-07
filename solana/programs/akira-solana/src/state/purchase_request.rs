use anchor_lang::prelude::*;
use crate::state::types::*;

#[account]
pub struct PurchaseRequest {
    pub owner: Pubkey,
    pub request_id: String,
    pub metadata_uri: String,
    pub price_estimate: u64,
    pub status: PurchaseRequestStatus,
    pub deposit_amount: u64,
    pub rwa_mint: Option<Pubkey>,
    pub purchase_confirmation: Option<String>,
    pub storage_id: Option<String>,
    pub timestamp: i64,
    pub admin_authority: Pubkey,
    pub cancellation_reason: Option<String>,
    pub deposit_token_type: DepositTokenType,
    pub deposit_token_mint: Option<Pubkey>,
} 
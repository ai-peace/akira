use anchor_lang::prelude::*;
use crate::state::types::*;

#[account]
pub struct ExchangeRequest {
    pub owner: Pubkey,              // NFT holder
    pub request_id: String,         // Unique exchange request ID
    pub nft_mint: Pubkey,          // Target NFT mint
    pub shipping_fee: u64,         // Required shipping fee amount
    pub status: ExchangeStatus,    // Request status
    pub deposit_amount: u64,       // Actual deposited amount
    pub tracking_info: Option<String>, // Shipping tracking number (optional)
    pub timestamp: i64,            // Creation timestamp
    pub admin_authority: Pubkey,   // Admin who created request
    pub cancellation_reason: Option<String>, // Refund reason if cancelled
    pub deposit_token_type: DepositTokenType, // SOL/USDT/USDC
    pub deposit_token_mint: Option<Pubkey>, // Token mint if not SOL
} 
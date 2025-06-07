use anchor_lang::prelude::*;

#[account]
pub struct RwaState {
    pub owner: Pubkey,
    pub uri: String,
    pub is_exchangeable: bool,
    pub exchanged_at: Option<i64>,
    pub locked_at: Option<i64>,
    pub lock_reason: Option<String>,
} 
use anchor_lang::prelude::*;

#[account]
pub struct CollectionConfig {
    pub authority: Pubkey,
    pub collection_mint: Pubkey,
    pub collection_metadata: Pubkey,
    pub collection_master_edition: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub seller_fee_basis_points: u16,
} 
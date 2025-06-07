use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum PurchaseRequestStatus {
    Created,      // Purchase request created by admin
    Funded,       // User deposited required amount
    Completed,    // NFT minted successfully
    Redeemed,     // NFT transferred to user
    Cancelled,    // Cancelled by admin
    Refunded,     // Funds refunded to user
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum DepositTokenType {
    Sol,
    Usdt,
    Usdc,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum ExchangeStatus {
    Created,      // Exchange request created by admin
    Funded,       // User deposited shipping fee
    Frozen,       // NFT frozen by admin
    Shipped,      // Admin shipped physical item
    Completed,    // Exchange completed successfully
    Cancelled,    // Cancelled by admin
    Refunded,     // Shipping fee refunded
} 
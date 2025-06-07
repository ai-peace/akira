use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid request status")]
    InvalidPurchaseRequestStatus,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Invalid deposit account")]
    InvalidDepositAccount,
    #[msg("String too long")]
    StringTooLong,
    #[msg("Not exchangeable")]
    NotExchangeable,
    #[msg("Cannot deposit after refund")]
    CannotDepositAfterRefund,
    #[msg("Cannot deposit after completion")]
    CannotDepositAfterCompletion,
    #[msg("No funds to refund")]
    NoFundsToRefund,
    #[msg("Invalid deposit token type")]
    InvalidDepositTokenType,
    #[msg("Token account not provided")]
    TokenAccountNotProvided,
    #[msg("Exchange request not found")]
    ExchangeRequestNotFound,
    #[msg("Insufficient shipping fee")]
    InsufficientShippingFee,
    #[msg("Cannot refund after shipping")]
    CannotRefundAfterShipping,
    #[msg("Invalid exchange status")]
    InvalidExchangeStatus,
    #[msg("NFT not owned by user")]
    NFTNotOwnedByUser,
    #[msg("Invalid purchase request status for this operation")]
    InvalidPurchaseStatus,
    #[msg("Invalid Master Edition PDA - freeze authority mismatch")]
    InvalidMasterEdition,
} 
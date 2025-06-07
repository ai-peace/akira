use anchor_lang::prelude::*;

/// Find metadata PDA for NFT
pub fn find_metadata_account(mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            mint.as_ref(),
        ],
        &mpl_token_metadata::ID,
    )
}

/// Find master edition PDA for NFT
pub fn find_master_edition_account(mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            mint.as_ref(),
            b"edition",
        ],
        &mpl_token_metadata::ID,
    )
} 
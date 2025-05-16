use anchor_lang::prelude::*;
use anchor_spl::token_2022 as token;
use token::{Mint, TokenAccount, initialize_mint, mint_to, FreezeAccount, freeze_account};
use mpl_token_metadata::instruction::{create_metadata_accounts_v3, create_verify_collection_v1};
use mpl_token_metadata::state::{DataV2, Collection, Creator};

declare_id!("YourProgramID1111111111111111111111111111111111");

#[program]
pub mod rwa_nft_full {
    use super::*;

    pub fn initialize_state(ctx: Context<InitializeState>, uri: String) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.owner = *ctx.accounts.authority.key;
        state.uri = uri;
        state.is_exchangeable = true;
        state.exchanged_at = None;
        Ok(())
    }

    pub fn mint_rwa_nft(ctx: Context<MintRwaNft>) -> Result<()> {
        // 1) Mint 初期化
        initialize_mint(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::InitializeMint {
                    mint: ctx.accounts.mint.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                }
            ),
            0,
            ctx.accounts.authority.key(),
            Some(ctx.accounts.state.key()),
        )?;

        // 2) Metadata 作成 (Collection 指定)
        let metadata_pda = ctx.accounts.metadata_pda.key();
        let data = DataV2 {
            name: ctx.accounts.name.clone(),
            symbol: ctx.accounts.symbol.clone(),
            uri: ctx.accounts.uri.clone(),
            seller_fee_basis_points: ctx.accounts.seller_fee_basis_points,
            creators: None,
            collection: Some(Collection { key: ctx.accounts.collection_mint.key(), verified: false }),
            uses: None,
        };
        let cpi_accounts = vec![
            ctx.accounts.metadata_pda.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ];
        invoke(
            &create_metadata_accounts_v3(
                ctx.accounts.token_metadata_program.key(),
                metadata_pda,
                ctx.accounts.mint.key(),
                ctx.accounts.authority.key(),
                ctx.accounts.payer.key(),
                ctx.accounts.authority.key(),
                data,
                true,
                false,
                None,
                None,
                None,
            ),
            &cpi_accounts,
        )?;

        // 3) Collection 検証 CPI
        let verify_accounts = vec![
            ctx.accounts.metadata_pda.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.collection_metadata.to_account_info(),
            ctx.accounts.collection_master_edition.to_account_info(),
            ctx.accounts.authority.to_account_info(),
        ];
        invoke(
            &create_verify_collection_v1(
                ctx.accounts.token_metadata_program.key(),
                metadata_pda,
                ctx.accounts.collection_mint.key(),
                ctx.accounts.collection_metadata.key(),
                ctx.accounts.collection_master_edition.key(),
                ctx.accounts.authority.key(),
                ctx.accounts.authority.key(),
            ),
            &verify_accounts,
        )?;

        // 4) Token Mint
        mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                }
            ),
            1,
        )?;

        Ok(())
    }

    pub fn exchange_nft(ctx: Context<ExchangeNft>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(state.is_exchangeable, ErrorCode::NotExchangeable);
        freeze_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                FreezeAccount {
                    account: ctx.accounts.token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    authority: ctx.accounts.state.to_account_info(),
                }
            )
        )?;
        state.is_exchangeable = false;
        state.exchanged_at = Some(Clock::get()?.unix_timestamp);
        Ok(())
    }

    pub fn update_uri(ctx: Context<UpdateUri>, new_uri: String) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(state.owner == *ctx.accounts.authority.key, ErrorCode::Unauthorized);
        state.uri = new_uri;
        Ok(())
    }
}

#[account]
pub struct RwaState {
    pub owner: Pubkey,
    pub uri: String,
    pub is_exchangeable: bool,
    pub exchanged_at: Option<i64>,
}

#[derive(Accounts)]
pub struct InitializeState<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 4 + uri.len() + 1 + 9)]
    pub state: Account<'info, RwaState>,
    #[account(mut)] pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintRwaNft<'info> {
    #[account(mut, has_one = owner)]
    pub state: Account<'info, RwaState>,

    #[account(init, payer = payer, space = 0)]
    pub mint: Account<'info, Mint>,

    #[account(init_if_needed, payer = payer, associated_token::mint = mint, associated_token::authority = authority)]
    pub token_account: Account<'info, TokenAccount>,

    /// Metadata CPI 用 PDA: ["metadata", token_metadata_program, mint]
    #[account(mut)] pub metadata_pda: UncheckedAccount<'info>,
    /// コレクション用 Mint
    pub collection_mint: Account<'info, Mint>,
    /// コレクション Metadata PDA
    #[account(mut)] pub collection_metadata: UncheckedAccount<'info>,
    /// コレクション MasterEdition PDA
    #[account(mut)] pub collection_master_edition: UncheckedAccount<'info>,

    pub payer: Signer<'info>,
    #[account(mut)] pub authority: Signer<'info>,
    pub token_program: Program<'info, token::Token>,
    pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

    // metadata data
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub seller_fee_basis_points: u16,
}

#[derive(Accounts)]
pub struct ExchangeNft<'info> {
    #[account(mut, has_one = owner)] pub state: Account<'info, RwaState>,
    pub owner: Signer<'info>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = owner)] pub token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, token::Token>,
}

#[derive(Accounts)]
pub struct UpdateUri<'info> {
    #[account(mut, has_one = owner)] pub state: Account<'info, RwaState>,
    pub authority: Signer<'info>,
}

#[error_code]
enum ErrorCode {
    #[msg("Not authorized")] Unauthorized,
    #[msg("NFT is not exchangeable")] NotExchangeable,
}
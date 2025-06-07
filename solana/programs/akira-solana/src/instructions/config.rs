use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, TokenAccount, Token, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::{
    instructions::{CreateMetadataAccountV3, CreateMasterEditionV3},
    types::{DataV2, Creator},
};
use anchor_lang::solana_program::program::invoke;
use crate::state::*;
use crate::errors::ErrorCode as CustomErrorCode;

/// グローバル設定の初期化
pub fn initialize_config(
    ctx: Context<InitializeConfig>,
    deposit_target: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.global_config;
    config.admin = ctx.accounts.admin.key();
    config.deposit_target = deposit_target;
    Ok(())
}

/// 送付先更新命令（管理者のみ）
pub fn update_deposit_target(
    ctx: Context<UpdateConfig>,
    new_deposit_target: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.global_config;
    config.deposit_target = new_deposit_target;
    Ok(())
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
    msg!("Initializing RWA Collection: {} with seed: {}", name, collection_seed);

    // Token Mint (1個) - Collection NFT
    token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo { 
                mint: ctx.accounts.collection_mint.to_account_info(), 
                to: ctx.accounts.collection_token_account.to_account_info(), 
                authority: ctx.accounts.authority.to_account_info() 
            }
        ),
        1,
    )?;

    // Collection Metadata作成
    let creators = vec![Creator {
        address: ctx.accounts.authority.key(),
        verified: true,
        share: 100,
    }];

    let data = DataV2 {
        name: name.clone(),
        symbol: symbol.clone(),
        uri: uri.clone(),
        seller_fee_basis_points,
        creators: Some(creators),
        collection: None,
        uses: None,
    };

    let create_metadata_accounts_v3 = CreateMetadataAccountV3 {
        metadata: ctx.accounts.collection_metadata.key(),
        mint: ctx.accounts.collection_mint.key(),
        mint_authority: ctx.accounts.authority.key(),
        payer: ctx.accounts.payer.key(),
        update_authority: (ctx.accounts.authority.key(), true),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    };

    invoke(
        &create_metadata_accounts_v3.instruction(
            mpl_token_metadata::instructions::CreateMetadataAccountV3InstructionArgs {
                data,
                is_mutable: true,
                collection_details: None,
            }
        ),
        &[
            ctx.accounts.collection_metadata.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
    )?;

    // Master Edition作成（Collection用）
    let create_master_edition_v3 = CreateMasterEditionV3 {
        edition: ctx.accounts.collection_master_edition.key(),
        mint: ctx.accounts.collection_mint.key(),
        update_authority: ctx.accounts.authority.key(),
        mint_authority: ctx.accounts.authority.key(),
        payer: ctx.accounts.payer.key(),
        metadata: ctx.accounts.collection_metadata.key(),
        token_program: ctx.accounts.token_program.key(),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    };

    invoke(
        &create_master_edition_v3.instruction(
            mpl_token_metadata::instructions::CreateMasterEditionV3InstructionArgs {
                max_supply: Some(0), // Collection NFT
            }
        ),
        &[
            ctx.accounts.collection_master_edition.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.collection_metadata.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
    )?;

    // CollectionConfig保存
    let config = &mut ctx.accounts.collection_config;
    config.authority = ctx.accounts.authority.key();
    config.collection_mint = ctx.accounts.collection_mint.key();
    config.collection_metadata = ctx.accounts.collection_metadata.key();
    config.collection_master_edition = ctx.accounts.collection_master_edition.key();
    config.name = name;
    config.symbol = symbol;
    config.uri = uri;
    config.seller_fee_basis_points = seller_fee_basis_points;

    msg!("Collection initialized successfully: {}", ctx.accounts.collection_mint.key());
    Ok(())
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
    let config = &mut ctx.accounts.collection_config;
    
    // 管理者権限チェック
    require!(
        config.authority == ctx.accounts.authority.key(),
        CustomErrorCode::Unauthorized
    );

    msg!("Updating collection with seed: {} by authority: {}", collection_seed, ctx.accounts.authority.key());

    // 文字列長チェックと更新
    if let Some(name) = new_name {
        require!(name.len() <= 100, CustomErrorCode::StringTooLong);
        config.name = name;
        msg!("Updated collection name");
    }
    
    if let Some(symbol) = new_symbol {
        require!(symbol.len() <= 20, CustomErrorCode::StringTooLong);
        config.symbol = symbol;
        msg!("Updated collection symbol");
    }
    
    if let Some(uri) = new_uri {
        require!(uri.len() <= 200, CustomErrorCode::StringTooLong);
        config.uri = uri;
        msg!("Updated collection URI");
    }
    
    if let Some(fee) = new_seller_fee_basis_points {
        config.seller_fee_basis_points = fee;
        msg!("Updated collection seller fee: {}%", fee as f64 / 100.0);
    }

    msg!("Collection updated successfully: {}", config.collection_mint);
    Ok(())
}

// Context structures

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 32,
        seeds = [b"config"],
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump,
        has_one = admin @ CustomErrorCode::Unauthorized
    )]
    pub global_config: Account<'info, GlobalConfig>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String, uri: String, seller_fee_basis_points: u16, collection_seed: String)]
pub struct InitializeCollection<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 * 4 + 4 + 100 + 4 + 20 + 4 + 200 + 2, // 固定サイズ: name(100), symbol(20), uri(200)
        seeds = [b"collection_config", collection_seed.as_bytes()],
        bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    #[account(
        init, 
        payer = payer, 
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = authority,
    )] 
    pub collection_mint: Account<'info, Mint>,
    
    #[account(
        init, 
        payer = payer, 
        associated_token::mint = collection_mint, 
        associated_token::authority = authority
    )] 
    pub collection_token_account: Account<'info, TokenAccount>,

    /// CHECK: Collection Metadata account
    #[account(
        mut,
        seeds = [
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            collection_mint.key().as_ref(),
        ],
        bump,
        seeds::program = mpl_token_metadata::ID,
    )]
    pub collection_metadata: UncheckedAccount<'info>,

    /// CHECK: Collection Master edition account
    #[account(
        mut,
        seeds = [
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            collection_mint.key().as_ref(),
            b"edition",
        ],
        bump,
        seeds::program = mpl_token_metadata::ID,
    )]
    pub collection_master_edition: UncheckedAccount<'info>,
    
    #[account(mut)] 
    pub payer: Signer<'info>,
    
    #[account(mut)] 
    pub authority: Signer<'info>,
    
    /// CHECK: Token Metadata Program
    #[account(constraint = token_metadata_program.key() == mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(collection_seed: String)]
pub struct UpdateCollection<'info> {
    #[account(
        mut,
        seeds = [b"collection_config", collection_seed.as_bytes()],
        bump,
        has_one = authority @ CustomErrorCode::Unauthorized
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
} 
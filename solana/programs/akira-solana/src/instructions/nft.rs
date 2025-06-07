use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, TokenAccount, Token, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::{
    instructions::{CreateMetadataAccountV3, CreateMasterEditionV3, CreateMetadataAccountV3InstructionArgs, CreateMasterEditionV3InstructionArgs},
    types::{DataV2, Creator, Collection},
};
use anchor_lang::solana_program::program::invoke;
use crate::state::*;
use crate::errors::ErrorCode as CustomErrorCode;
use crate::utils::{find_metadata_account, find_master_edition_account};

/// RWA対応コレクション付きNFTミント（authority実行、target_userに配布）
pub fn mint_rwa_collection_nft(
    ctx: Context<MintRwaCollectionNft>,
    collection_seed: String,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    msg!("Authority minting RWA Collection NFT: {} in collection with seed: {}", name, collection_seed);
    
    let purchase_request = &mut ctx.accounts.purchase_request;
    let target_user = ctx.accounts.target_user.key();

    // Target userの検証
    require!(
        purchase_request.owner == target_user,
        CustomErrorCode::Unauthorized
    );

    // 資金確認（必須条件追加）
    require!(
        purchase_request.status == PurchaseRequestStatus::Funded,
        CustomErrorCode::InvalidPurchaseRequestStatus
    );

    msg!("Minting NFT to target user: {}", target_user);

    // Token Mint (1個) - NFT を target_user に配布
    token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),  // target_userのATA
                authority: ctx.accounts.admin.to_account_info()  // adminが実行
            }
        ),
        1,
    )?;

    // Collection情報取得（必須）
    let collection_config = &ctx.accounts.collection_config;

    // Metadata作成（target_userがcreator）
    let create_metadata_instruction = CreateMetadataAccountV3 {
        metadata: ctx.accounts.metadata.key(),
        mint: ctx.accounts.mint.key(),
        mint_authority: ctx.accounts.admin.key(),
        payer: ctx.accounts.admin.key(),
        update_authority: (ctx.accounts.admin.key(), true),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    };

    let metadata_data = DataV2 {
        name: name.clone(),
        symbol: symbol.clone(),
        uri: uri.clone(),
        seller_fee_basis_points: collection_config.seller_fee_basis_points,
        creators: Some(vec![Creator {
            address: target_user,  // target_userをcreatorに設定
            verified: false,       // adminがミントするためfalse
            share: 100,
        }]),
        collection: Some(Collection {
            verified: false,
            key: collection_config.collection_mint,
        }),
        uses: None,
    };

    invoke(
        &create_metadata_instruction.instruction(CreateMetadataAccountV3InstructionArgs {
            data: metadata_data,
            is_mutable: true,
            collection_details: None,
        }),
        &[
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.admin.to_account_info(),
            ctx.accounts.admin.to_account_info(),
            ctx.accounts.admin.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
    )?;

    // Master Edition作成
    let create_master_edition_instruction = CreateMasterEditionV3 {
        edition: ctx.accounts.master_edition.key(),
        mint: ctx.accounts.mint.key(),
        update_authority: ctx.accounts.admin.key(),
        mint_authority: ctx.accounts.admin.key(),
        payer: ctx.accounts.admin.key(),
        metadata: ctx.accounts.metadata.key(),
        token_program: ctx.accounts.token_program.key(),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    };

    invoke(
        &create_master_edition_instruction.instruction(CreateMasterEditionV3InstructionArgs {
            max_supply: Some(0),
        }),
        &[
            ctx.accounts.master_edition.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.admin.to_account_info(),
            ctx.accounts.admin.to_account_info(),
            ctx.accounts.admin.to_account_info(),
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
    )?;

    // RWA State初期化（target_userがowner）
    let rwa_state = &mut ctx.accounts.rwa_state;
    rwa_state.owner = target_user;  // target_userが所有者
    rwa_state.uri = uri;
    rwa_state.is_exchangeable = true;
    rwa_state.exchanged_at = None;
    rwa_state.locked_at = None;
    rwa_state.lock_reason = None;

    // PurchaseRequest 最終更新
    purchase_request.rwa_mint = Some(ctx.accounts.mint.key());
    purchase_request.status = PurchaseRequestStatus::Completed;

    msg!("RWA Collection NFT minted successfully: {}", ctx.accounts.mint.key());
    msg!("NFT distributed to target user: {}", target_user);
    msg!("Associated with collection: {}", collection_config.collection_mint);
    
    Ok(())
}

/// 管理者緊急ロック機能（資産問題時の管理者ロック）
pub fn admin_lock_nft(
    ctx: Context<AdminLockNft>,
    reason: String,
) -> Result<()> {
    // グローバル管理者権限確認
    require!(
        ctx.accounts.global_config.admin == ctx.accounts.admin.key(),
        CustomErrorCode::Unauthorized
    );

    msg!("Admin locking NFT: {}", ctx.accounts.mint.key());
    msg!("Admin: {}", ctx.accounts.admin.key());
    msg!("Reason: {}", reason);

    // Master Edition PDA計算と検証
    let mint_key = ctx.accounts.mint.key();
    let master_edition_seeds = &[
        b"metadata",
        mpl_token_metadata::ID.as_ref(),
        mint_key.as_ref(),
        b"edition",
    ];
    let (master_edition_pda, master_edition_bump) = Pubkey::find_program_address(
        master_edition_seeds,
        &mpl_token_metadata::ID,
    );

    msg!("Expected Master Edition PDA: {}", master_edition_pda);
    msg!("Provided Master Edition account: {}", ctx.accounts.master_edition.key());

    // Master Edition PDA validation
    require!(
        ctx.accounts.master_edition.key() == master_edition_pda,
        CustomErrorCode::InvalidMasterEdition
    );

    // Token program freeze操作 - Master Edition PDAsignersで
    let freeze_instruction = anchor_spl::token::freeze_account(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::FreezeAccount {
                account: ctx.accounts.token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                authority: ctx.accounts.master_edition.to_account_info(),
            },
            &[&[
                b"metadata",
                mpl_token_metadata::ID.as_ref(),
                mint_key.as_ref(),
                b"edition",
                &[master_edition_bump],
            ]]
        ),
    );

    match freeze_instruction {
        Ok(_) => {
            // RWA State更新
            let rwa_state = &mut ctx.accounts.rwa_state;
            rwa_state.is_exchangeable = false;
            rwa_state.locked_at = Some(Clock::get()?.unix_timestamp);
            rwa_state.lock_reason = Some(reason.clone());

            msg!("Successfully froze NFT for admin lock");
            msg!("Lock reason: {}", reason);
        }
        Err(e) => {
            msg!("Failed to freeze NFT: {:?}", e);
            msg!("Admin lock recorded but freeze failed");
            
            // RWA Stateは更新（freeze失敗でも記録保持）
            let rwa_state = &mut ctx.accounts.rwa_state;
            rwa_state.is_exchangeable = false;
            rwa_state.locked_at = Some(Clock::get()?.unix_timestamp);
            rwa_state.lock_reason = Some(format!("FREEZE_FAILED: {}", reason));
        }
    }

    Ok(())
}

/// URI更新機能（管理者のみ）
pub fn update_rwa_uri(
    ctx: Context<UpdateRwaUri>,
    collection_seed: String,
    new_uri: String,
) -> Result<()> {
    let state = &mut ctx.accounts.rwa_state;
    
    // コレクション管理者確認
    require!(
        ctx.accounts.collection_config.authority == ctx.accounts.collection_authority.key(),
        CustomErrorCode::Unauthorized
    );

    let old_uri = state.uri.clone();
    state.uri = new_uri.clone();

    msg!("RWA URI updated for mint: {}", ctx.accounts.mint.key());
    msg!("Collection Seed: {}", collection_seed);
    msg!("Updated by Collection Authority: {}", ctx.accounts.collection_authority.key());
    msg!("Old URI: {}", old_uri);
    msg!("New URI: {}", new_uri);
    
    Ok(())
}

// Context structures

#[derive(Accounts)]
#[instruction(collection_seed: String, name: String, symbol: String, uri: String)]
pub struct MintRwaCollectionNft<'info> {
    #[account(mut)]
    pub purchase_request: Account<'info, PurchaseRequest>,
    
    /// コレクション設定（動的シード対応）
    #[account(
        seeds = [b"collection_config", collection_seed.as_bytes()],
        bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    /// グローバル設定（authority権限チェック用）
    #[account(
        seeds = [b"config"],
        bump,
        has_one = admin @ CustomErrorCode::Unauthorized
    )]
    pub global_config: Account<'info, GlobalConfig>,
    
    /// 実行者（authority）
    #[account(mut)]
    pub admin: Signer<'info>,

    /// NFT Mint account  
    #[account(
        init, 
        payer = admin, 
        mint::decimals = 0,
        mint::authority = admin,
        mint::freeze_authority = admin, // adminに設定（後でcollection authorityに移譲可能）
    )] 
    pub mint: Account<'info, Mint>,

    /// RWA State（同時に初期化）
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 4 + uri.len() + 1 + 9 + 9 + 4 + 100, // locked_at (9) + lock_reason (4+100) 追加
        seeds = [b"rwa_state", mint.key().as_ref()],
        bump
    )]
    pub rwa_state: Account<'info, RwaState>,

    /// NFT Token Account（target_user用）
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = target_user
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// Target User（purchase_requestのowner）
    /// CHECK: Purchase requestのowner field と一致することをinstruction内で検証
    pub target_user: UncheckedAccount<'info>,

    /// NFT Metadata PDA 
    /// CHECK: address constraint
    #[account(
        mut,
        address = find_metadata_account(&mint.key()).0
    )]
    pub metadata: UncheckedAccount<'info>,

    /// NFT Master Edition PDA
    /// CHECK: address constraint  
    #[account(
        mut,
        address = find_master_edition_account(&mint.key()).0
    )]
    pub master_edition: UncheckedAccount<'info>,
    
    /// Metaplex Token Metadata program
    /// CHECK: verified by address
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}



#[derive(Accounts)]
pub struct AdminLockNft<'info> {
    #[account(
        mut,
        seeds = [b"rwa_state", mint.key().as_ref()],
        bump
    )]
    pub rwa_state: Account<'info, RwaState>,
    
    #[account(seeds = [b"config"], bump)]
    pub global_config: Account<'info, GlobalConfig>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        mut,
        constraint = token_account.mint == mint.key()
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    /// NFT Master Edition PDA（freeze authority）
    /// CHECK: address constraint
    #[account(
        address = find_master_edition_account(&mint.key()).0
    )]
    pub master_edition: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(collection_seed: String)]
pub struct UpdateRwaUri<'info> {
    #[account(
        mut,
        seeds = [b"rwa_state", mint.key().as_ref()],
        bump
    )]
    pub rwa_state: Account<'info, RwaState>,
    
    /// コレクション設定（管理者確認用）
    #[account(
        seeds = [b"collection_config", collection_seed.as_bytes()],
        bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    /// CHECK: NFT Mint address for PDA seed
    pub mint: Account<'info, Mint>,
    
    /// コレクション管理者（物理資産管理者）
    #[account(mut)]
    pub collection_authority: Signer<'info>,
} 
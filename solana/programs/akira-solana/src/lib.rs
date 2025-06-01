use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, TokenAccount, Token, MintTo, FreezeAccount};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::{
    instructions::{CreateMetadataAccountV3, CreateMasterEditionV3, CreateMetadataAccountV3InstructionArgs, CreateMasterEditionV3InstructionArgs},
    types::{DataV2, Creator, Collection},
};
use anchor_lang::solana_program::program::invoke;
use anchor_spl::token_interface::spl_token_2022::solana_program::pubkey::Pubkey;

declare_id!("CY6qKVgEFq5yztnwq2ycf1hQAmuDnsaH62DCXMYgQJAK");

// Helper functions for PDA calculation
pub fn find_metadata_accounfind_metadata_accountt(mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            "metadata".as_bytes(),
            mpl_token_metadata::ID.as_ref(),
            mint.as_ref(),
        ],
        &mpl_token_metadata::ID,
    )
}

pub fn find_master_edition_account(mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            "metadata".as_bytes(),
            mpl_token_metadata::ID.as_ref(),
            mint.as_ref(),
            "edition".as_bytes(),
        ],
        &mpl_token_metadata::ID,
    )
}

#[program]
pub mod akira_solana {
    use super::*;

    // x グローバル設定の初期化
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        deposit_target: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.global_config;
        config.admin = ctx.accounts.admin.key();
        config.deposit_target = deposit_target;
        Ok(())
    }

    // x 送付先更新命令（管理者のみ）
    pub fn update_deposit_target(
        ctx: Context<UpdateConfig>,
        new_deposit_target: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.global_config;
        config.deposit_target = new_deposit_target;
        Ok(())
    }

    // x 🏛️ NFTコレクション初期化
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

    // x 🔄 管理者のみコレクションを更新可能
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
            ErrorCode::Unauthorized
        );

        msg!("Updating collection with seed: {} by authority: {}", collection_seed, ctx.accounts.authority.key());

        // 文字列長チェックと更新
        if let Some(name) = new_name {
            require!(name.len() <= 100, ErrorCode::StringTooLong);
            config.name = name;
            msg!("Updated collection name");
        }
        
        if let Some(symbol) = new_symbol {
            require!(symbol.len() <= 20, ErrorCode::StringTooLong);
            config.symbol = symbol;
            msg!("Updated collection symbol");
        }
        
        if let Some(uri) = new_uri {
            require!(uri.len() <= 200, ErrorCode::StringTooLong);
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

    // x 購入リクエストを作成
    pub fn create_purchase_request(
        ctx: Context<CreatePurchaseRequest>,
        request_id: String,
        metadata_uri: String,
        price_estimate: u64,
    ) -> Result<()> {
        let purchase_request = &mut ctx.accounts.purchase_request;
        purchase_request.owner = ctx.accounts.user.key();
        purchase_request.request_id = request_id;
        purchase_request.metadata_uri = metadata_uri;
        purchase_request.price_estimate = price_estimate;
        purchase_request.status = RequestStatus::Created;
        purchase_request.deposit_amount = 0;
        purchase_request.rwa_mint = None;
        purchase_request.timestamp = Clock::get()?.unix_timestamp;
        purchase_request.admin_authority = ctx.accounts.admin_authority.key();
        
        Ok(())
    }

    // x SOLデポジットを受け付ける
    pub fn deposit_funds(
        ctx: Context<DepositFunds>,
        amount: u64,
    ) -> Result<()> {
        // ユーザーからデポジットアカウントへSOLを転送
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.owner.to_account_info(),
                    to: ctx.accounts.deposit_account.to_account_info(),
                },
            ),
            amount,
        )?;
    
        // 購入リクエストの状態を更新
        let purchase_request = &mut ctx.accounts.purchase_request;
        purchase_request.deposit_amount = purchase_request.deposit_amount.checked_add(amount).unwrap();
        
        // 十分な額がデポジットされたら状態を更新
        if purchase_request.deposit_amount >= purchase_request.price_estimate {
            purchase_request.status = RequestStatus::Funded;
        }
    
        Ok(())
    }

    // x 🎨 RWA対応コレクション付きNFTミント（freeze_authority付き）
    pub fn mint_rwa_collection_nft(
        ctx: Context<MintRwaCollectionNft>,
        collection_seed: String,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        msg!("Minting RWA Collection NFT: {} in collection with seed: {}", name, collection_seed);
        
        let purchase_request = &mut ctx.accounts.purchase_request;

        // 資金確認（必須条件追加）
        require!(
            purchase_request.status == RequestStatus::Funded,
            ErrorCode::InvalidRequestStatus
        );

        // Token Mint (1個) - NFT
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info()
                }
            ),
            1,
        )?;

        // Collection情報取得（必須）
        let collection_config = &ctx.accounts.collection_config;

        // Metadata作成
        let create_metadata_instruction = CreateMetadataAccountV3 {
            metadata: ctx.accounts.metadata.key(),
            mint: ctx.accounts.mint.key(),
            mint_authority: ctx.accounts.owner.key(),
            payer: ctx.accounts.payer.key(),
            update_authority: (ctx.accounts.owner.key(), true),
            system_program: ctx.accounts.system_program.key(),
            rent: Some(ctx.accounts.rent.key()),
        };

        let metadata_data = DataV2 {
            name: name.clone(),
            symbol: symbol.clone(),
            uri: uri.clone(),
            seller_fee_basis_points: collection_config.seller_fee_basis_points, // collection_configから取得
            creators: Some(vec![Creator {
                address: ctx.accounts.owner.key(),
                verified: true,
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
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;

        // Master Edition作成
        let create_master_edition_instruction = CreateMasterEditionV3 {
            edition: ctx.accounts.master_edition.key(),
            mint: ctx.accounts.mint.key(),
            update_authority: ctx.accounts.owner.key(),
            mint_authority: ctx.accounts.owner.key(),
            payer: ctx.accounts.payer.key(),
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
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.metadata.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;

        // RWA State初期化
        let rwa_state = &mut ctx.accounts.rwa_state;
        rwa_state.owner = ctx.accounts.owner.key();
        rwa_state.uri = uri;
        rwa_state.is_exchangeable = true;
        rwa_state.exchanged_at = None;

        // PurchaseRequest 更新（追加）
        purchase_request.rwa_mint = Some(ctx.accounts.mint.key());
        purchase_request.status = RequestStatus::Completed;

        msg!("RWA Collection NFT minted successfully: {}", ctx.accounts.mint.key());
        msg!("Associated with collection: {}", collection_config.collection_mint);
        msg!("Freeze authority set to RWA State: {}", ctx.accounts.rwa_state.key());
        
        Ok(())
    }

    // x 🔄 RWA Exchange機能（管理者が実行）
    pub fn exchange_nft(ctx: Context<ExchangeNft>) -> Result<()> {
        // オーナー本人確認
        require!(
            ctx.accounts.rwa_state.owner == ctx.accounts.owner.key(),
            ErrorCode::Unauthorized
        );
        
        // コレクション管理者確認
        require!(
            ctx.accounts.collection_config.authority == ctx.accounts.collection_authority.key(),
            ErrorCode::Unauthorized
        );
        
        require!(
            ctx.accounts.rwa_state.is_exchangeable,
            ErrorCode::NotExchangeable
        );

        msg!("Exchanging NFT: {}", ctx.accounts.mint.key());
        msg!("Owner: {}", ctx.accounts.owner.key());
        msg!("Collection Authority: {}", ctx.accounts.collection_authority.key());

        // NFTをフリーズ（コレクション管理者権限で）
        token::freeze_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                FreezeAccount {
                    account: ctx.accounts.token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    authority: ctx.accounts.collection_authority.to_account_info(),
                },
            ),
        )?;

        msg!("NFT frozen by Collection Authority");

        // 状態更新
        let state = &mut ctx.accounts.rwa_state;
        state.is_exchangeable = false;
        state.exchanged_at = Some(Clock::get()?.unix_timestamp);

        msg!("NFT exchanged and frozen successfully");
        msg!("Exchanged at: {}", state.exchanged_at.unwrap());
        
        Ok(())
    }

    // x 🚨 管理者緊急ロック機能（資産問題時の管理者ロック）
    pub fn admin_lock_nft(
        ctx: Context<AdminLockNft>,
        reason: String,
    ) -> Result<()> {
        // グローバル管理者権限確認
        require!(
            ctx.accounts.global_config.admin == ctx.accounts.admin.key(),
            ErrorCode::Unauthorized
        );

        msg!("Admin locking NFT: {}", ctx.accounts.mint.key());
        msg!("Admin: {}", ctx.accounts.admin.key());
        msg!("Reason: {}", reason);

        // Note: admin_lock_nft機能の実装は、実際の使用ケースでは
        // より複雑な権限管理が必要になります。この簡易実装では、
        // NFTが既にrwa_state PDAに権限が移譲されていることを前提とします。

        msg!("Admin forcing freeze of NFT (assuming freeze authority is already with RWA State PDA)");

        // NFTをフリーズ（rwa_state PDAの権限で）
        token::freeze_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                FreezeAccount {
                    account: ctx.accounts.token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    authority: ctx.accounts.rwa_state.to_account_info(),
                },
                &[&[
                    b"rwa_state",
                    ctx.accounts.mint.key().as_ref(),
                    &[ctx.bumps.rwa_state],
                ]]
            ),
        )?;

        // 状態更新
        let state = &mut ctx.accounts.rwa_state;
        state.is_exchangeable = false;
        state.exchanged_at = Some(Clock::get()?.unix_timestamp);

        msg!("NFT locked by admin successfully");
        
        Ok(())
    }

    // x 📝 URI更新機能（管理者のみ）
    pub fn update_rwa_uri(
        ctx: Context<UpdateRwaUri>,
        collection_seed: String,
        new_uri: String,
    ) -> Result<()> {
        let state = &mut ctx.accounts.rwa_state;
        
        // コレクション管理者確認
        require!(
            ctx.accounts.collection_config.authority == ctx.accounts.collection_authority.key(),
            ErrorCode::Unauthorized
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

    // x 購入リクエストが必要なデポジット額に達しているかを確認する
    pub fn is_purchase_request_funded(
        ctx: Context<CheckPurchaseRequestFunded>,
    ) -> Result<bool> {
        let purchase_request = &ctx.accounts.purchase_request;
        
        if purchase_request.status == RequestStatus::Funded {
            return Ok(true);
        }
        
        Ok(purchase_request.deposit_amount >= purchase_request.price_estimate)
    }

    // x リクエストIDから購入リクエストを取得する
    pub fn get_purchase_request_by_id(
        ctx: Context<GetPurchaseRequestById>,
    ) -> Result<PurchaseRequest> {
        let purchase_request = &ctx.accounts.purchase_request;
        
        let purchase_data = PurchaseRequest {
            owner: purchase_request.owner,
            request_id: purchase_request.request_id.clone(),
            metadata_uri: purchase_request.metadata_uri.clone(),
            price_estimate: purchase_request.price_estimate,
            status: purchase_request.status.clone(),
            deposit_amount: purchase_request.deposit_amount,
            rwa_mint: purchase_request.rwa_mint,
            purchase_confirmation: purchase_request.purchase_confirmation.clone(),
            storage_id: purchase_request.storage_id.clone(),
            timestamp: purchase_request.timestamp,
            admin_authority: purchase_request.admin_authority,
            cancellation_reason: purchase_request.cancellation_reason.clone(),
        };
        
        Ok(purchase_data)
    }

    // x オーナーとリクエストIDから購入リクエストPDAを検索する
    pub fn find_purchase_request(
        ctx: Context<FindPurchaseRequest>,
        owner: Pubkey,
        request_id: String,
    ) -> Result<Pubkey> {
        let (pda, _bump) = Pubkey::find_program_address(
            &[
                b"purchase_request",
                owner.as_ref(),
                request_id.as_bytes(),
            ],
            &ctx.program_id,
        );
        
        Ok(pda)
    }
}


// 初期化用コンテキスト
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

// 更新用コンテキスト
#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump,
        has_one = admin @ ErrorCode::Unauthorized
    )]
    pub global_config: Account<'info, GlobalConfig>,
    pub admin: Signer<'info>,
}

// アカウント構造体
#[derive(Accounts)]
#[instruction(request_id: String, metadata_uri: String)]
pub struct CreatePurchaseRequest<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 4 + request_id.len() + 4 + metadata_uri.len() + 8 + 1 + 8 + 33 + 4 + 100 + 4 + 50 + 8 + 32,
        seeds = [b"purchase_request", user.key().as_ref(), request_id.as_bytes()],
        bump
    )]
    pub purchase_request: Account<'info, PurchaseRequest>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: 管理者アドレス
    pub admin_authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositFunds<'info> {
    #[account(
        mut,
        has_one = owner @ ErrorCode::Unauthorized,
    )]
    pub purchase_request: Account<'info, PurchaseRequest>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(seeds = [b"config"], bump)]
    pub global_config: Account<'info, GlobalConfig>,
    
    #[account(
        mut,
        constraint = deposit_account.key() == global_config.deposit_target @ ErrorCode::InvalidDepositAccount
    )]
    /// CHECK: このアカウントはグローバル設定で指定された収集アカウントです
    pub deposit_account: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

/// 🎨 RWA対応コレクション付きNFTミント用コンテキスト（freeze_authority付き）
#[derive(Accounts)]
#[instruction(collection_seed: String, name: String, symbol: String, uri: String)]
pub struct MintRwaCollectionNft<'info> {
    #[account(
        mut,
        has_one = owner @ ErrorCode::Unauthorized,
    )]
    pub purchase_request: Account<'info, PurchaseRequest>,
    
    /// コレクション設定（動的シード対応）
    #[account(
        seeds = [b"collection_config", collection_seed.as_bytes()],
        bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    /// NFT Mint account  
    #[account(
        init, 
        payer = payer, 
        mint::decimals = 0,
        mint::authority = owner,
        mint::freeze_authority = collection_config.authority, // 管理者に設定
    )] 
    pub mint: Account<'info, Mint>,

    /// RWA State（同時に初期化）
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 4 + uri.len() + 1 + 9,
        seeds = [b"rwa_state", mint.key().as_ref()],
        bump
    )]
    pub rwa_state: Account<'info, RwaState>,

    /// NFT Token Account
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = owner
    )]
    pub token_account: Account<'info, TokenAccount>,

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

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub owner: Signer<'info>,
    
    /// Metaplex Token Metadata program
    /// CHECK: verified by address
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// 購入リクエストの資金状態を確認するコンテキスト
#[derive(Accounts)]
pub struct CheckPurchaseRequestFunded<'info> {
    #[account()]
    pub purchase_request: Account<'info, PurchaseRequest>,
}

// リクエストIDから購入リクエストを取得するためのコンテキスト
#[derive(Accounts)]
pub struct GetPurchaseRequestById<'info> {
    #[account()]
    pub purchase_request: Account<'info, PurchaseRequest>,
}

// PDA検索用のコンテキスト
#[derive(Accounts)]
pub struct FindPurchaseRequest<'info> {
    /// CHECK: プログラムIDの取得のみに使用
    pub system_program: Program<'info, System>,
}

// グローバル設定アカウント
#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub deposit_target: Pubkey,
}

/// 🏛️ コレクション情報を保持するアカウント
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

/// 🏛️ コレクション初期化用コンテキスト
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

/// 🔄 コレクション更新用コンテキスト（管理者のみ）
#[derive(Accounts)]
#[instruction(collection_seed: String)]
pub struct UpdateCollection<'info> {
    #[account(
        mut,
        seeds = [b"collection_config", collection_seed.as_bytes()],
        bump,
        has_one = authority @ ErrorCode::Unauthorized
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

/// 🎨 NFT交換・フリーズ用コンテキスト
#[derive(Accounts)]
pub struct ExchangeNft<'info> {
    #[account(
        mut,
        seeds = [b"rwa_state", mint.key().as_ref()],
        bump,
        has_one = owner @ ErrorCode::Unauthorized
    )]
    pub rwa_state: Account<'info, RwaState>,
    
    /// コレクション設定
    #[account(
        seeds = [b"collection_config", collection_config.name.as_bytes()], // seedは適切に調整が必要
        bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    /// コレクション管理者（freeze_authorityを持つ）
    #[account(mut)]
    pub collection_authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = token_account.mint == mint.key(),
        constraint = token_account.owner == owner.key()
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    pub token_program: Program<'info, Token>,
}

/// 🚨 管理者緊急ロック用コンテキスト
#[derive(Accounts)]
#[instruction(reason: String)]
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
    
    pub token_program: Program<'info, Token>,
}

/// 📝 RWA URI更新用コンテキスト（管理者のみ）
#[derive(Accounts)]
#[instruction(collection_seed: String, new_uri: String)]
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

// TODO: RWA関連の構造体（後で実装）
/// 各RWA-NFTの状態を管理するアカウント
#[account]
pub struct RwaState {
    pub owner: Pubkey,
    pub uri: String,
    pub is_exchangeable: bool,
    pub exchanged_at: Option<i64>,
}

// データ構造体
#[account]
pub struct PurchaseRequest {
    pub owner: Pubkey,
    pub request_id: String,
    pub metadata_uri: String,
    pub price_estimate: u64,
    pub status: RequestStatus,
    pub deposit_amount: u64,
    pub rwa_mint: Option<Pubkey>,
    pub purchase_confirmation: Option<String>,
    pub storage_id: Option<String>,
    pub timestamp: i64,
    pub admin_authority: Pubkey,
    pub cancellation_reason: Option<String>,
}

// 列挙型
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum RequestStatus {
    Created,
    Funded,
    Completed,
    Redeemed,
    Cancelled,
}

// エラーコード
#[error_code]
pub enum ErrorCode {
    Unauthorized,
    InvalidRequestStatus,
    InvalidMint,
    InvalidDepositAccount,
    StringTooLong,
    NotExchangeable,
} 
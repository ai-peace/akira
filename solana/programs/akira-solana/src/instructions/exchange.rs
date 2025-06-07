use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Token, Mint, FreezeAccount, ThawAccount};
use anchor_lang::system_program;
use crate::state::{GlobalConfig, ExchangeRequest, RwaState, ExchangeStatus, DepositTokenType};
use crate::errors::ErrorCode as CustomErrorCode;

/// 送料デポジット - ユーザー実行
pub fn deposit_shipping_fee(
    ctx: Context<DepositShippingFee>,
    deposit_amount: u64,
) -> Result<()> {
    let exchange_request = &mut ctx.accounts.exchange_request;

    msg!("User depositing shipping fee for request: {}", exchange_request.request_id);
    msg!("Required shipping fee: {}", exchange_request.shipping_fee);
    msg!("User depositing: {}", deposit_amount);

    // 状態確認
    require!(
        exchange_request.status == ExchangeStatus::Created,
        CustomErrorCode::InvalidExchangeStatus
    );

    // NFT所有権確認
    require!(
        ctx.accounts.rwa_state.owner == ctx.accounts.owner.key(),
        CustomErrorCode::NFTNotOwnedByUser
    );

    // 送料確認（指定額以上）
    require!(
        deposit_amount >= exchange_request.shipping_fee,
        CustomErrorCode::InsufficientShippingFee
    );

    // NFTミント一致確認
    require!(
        ctx.accounts.mint.key() == exchange_request.nft_mint,
        CustomErrorCode::InvalidMint
    );

    // exchangeable確認
    require!(
        ctx.accounts.rwa_state.is_exchangeable,
        CustomErrorCode::NotExchangeable
    );

    // 送料デポジット処理
    match exchange_request.deposit_token_type {
        DepositTokenType::Sol => {
            msg!("Depositing {} SOL as shipping fee", deposit_amount as f64 / 1_000_000_000.0);
            
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.owner.to_account_info(),
                        to: ctx.accounts.deposit_account.to_account_info(),
                    },
                ),
                deposit_amount,
            )?;
        },
        DepositTokenType::Usdt | DepositTokenType::Usdc => {
            msg!("Depositing {} tokens as shipping fee", deposit_amount);
            
            require!(
                ctx.accounts.user_token_account.is_some() && 
                ctx.accounts.deposit_token_account.is_some(),
                CustomErrorCode::TokenAccountNotProvided
            );
            
            let user_token_account = ctx.accounts.user_token_account.as_ref().unwrap();
            let deposit_token_account = ctx.accounts.deposit_token_account.as_ref().unwrap();
            
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.as_ref().unwrap().to_account_info(),
                    token::Transfer {
                        from: user_token_account.to_account_info(),
                        to: deposit_token_account.to_account_info(),
                        authority: ctx.accounts.owner.to_account_info(),
                    },
                ),
                deposit_amount,
            )?;
        },
    }

    // Exchange Request更新
    exchange_request.deposit_amount = deposit_amount;
    exchange_request.status = ExchangeStatus::Funded;

    msg!("✅ Shipping fee deposited successfully");
    msg!("Exchange status: Funded");
    msg!("Ready for admin to freeze NFT");

    Ok(())
}

/// x 新ワークフロー：交換リクエスト作成と即座の物理フリーズ（管理者のみ）
pub fn create_exchange_request_with_freeze(
    ctx: Context<CreateExchangeRequestWithFreeze>,
    nft_owner: Pubkey,
    request_id: String,
    nft_mint: Pubkey,
    shipping_fee: u64,
    deposit_token_type: DepositTokenType,
    deposit_token_mint: Option<Pubkey>,
) -> Result<()> {
    msg!("🚀 NEW WORKFLOW: Creating exchange request with immediate physical freeze");
    msg!("Admin: {}, NFT Owner: {}", ctx.accounts.admin.key(), nft_owner);
    msg!("Request ID: {}, NFT Mint: {}", request_id, nft_mint);
    msg!("Shipping Fee: {} lamports", shipping_fee);

    // トークンタイプとミントアドレスの整合性チェック
    match deposit_token_type {
        DepositTokenType::Sol => {
            require!(deposit_token_mint.is_none(), CustomErrorCode::InvalidDepositTokenType);
        },
        DepositTokenType::Usdt | DepositTokenType::Usdc => {
            require!(deposit_token_mint.is_some(), CustomErrorCode::TokenAccountNotProvided);
        },
    }

    // 1. Exchange Request作成
    let exchange_request = &mut ctx.accounts.exchange_request;
    exchange_request.owner = nft_owner;
    exchange_request.request_id = request_id.clone();
    exchange_request.nft_mint = nft_mint;
    exchange_request.shipping_fee = shipping_fee;
    exchange_request.status = ExchangeStatus::Frozen; // 即座にFrozen状態に！
    exchange_request.deposit_amount = 0;
    exchange_request.tracking_info = None;
    exchange_request.timestamp = Clock::get()?.unix_timestamp;
    exchange_request.admin_authority = ctx.accounts.admin.key();
    exchange_request.cancellation_reason = None;
    exchange_request.deposit_token_type = deposit_token_type;
    exchange_request.deposit_token_mint = deposit_token_mint;

    // 2. RWA State更新（ロック情報記録）
    let rwa_state = &mut ctx.accounts.rwa_state;
    rwa_state.locked_at = Some(Clock::get()?.unix_timestamp);
    rwa_state.lock_reason = Some("Pre-freeze: Exchange request created - awaiting deposit".to_string());

    // 3. 即座に物理的フリーズ実行
    msg!("🧊 Executing immediate physical freeze...");
    
    let freeze_cpi_accounts = FreezeAccount {
        account: ctx.accounts.token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: ctx.accounts.admin.to_account_info(), // Admin has freeze_authority!
    };
    
    let freeze_cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        freeze_cpi_accounts
    );
    
    token::freeze_account(freeze_cpi_ctx)?;

    msg!("🎉 NEW WORKFLOW COMPLETE!");
    msg!("✅ Exchange request created with immediate physical freeze");
    msg!("❄️ NFT is now physically frozen at SPL Token level");
    msg!("🚫 ALL external transfers (Phantom, Magic Eden, etc.) are BLOCKED");
    msg!("📝 Status: Frozen (awaiting deposit of {} lamports)", shipping_fee);
    msg!("⏳ Next: Owner must deposit {} lamports to proceed", shipping_fee);

    Ok(())
}

/// 条件未達成時のNFTフリーズ解除（管理者のみ）
pub fn thaw_nft_conditional(
    ctx: Context<ThawNftConditional>,
    reason: String,
) -> Result<()> {
    let exchange_request = &mut ctx.accounts.exchange_request;

    msg!("Admin conditionally thawing NFT for request: {}", exchange_request.request_id);
    msg!("Reason: {}", reason);

    // フリーズ状態確認
    require!(
        exchange_request.status == ExchangeStatus::Frozen,
        CustomErrorCode::InvalidExchangeStatus
    );

    // 物理的フリーズ解除
    msg!("🌡️ Executing physical thaw...");
    
    let thaw_cpi_accounts = ThawAccount {
        account: ctx.accounts.token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: ctx.accounts.admin.to_account_info(),
    };
    
    let thaw_cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        thaw_cpi_accounts
    );
    
    token::thaw_account(thaw_cpi_ctx)?;

    // ステータス更新
    exchange_request.status = ExchangeStatus::Created; // Back to Created
    exchange_request.cancellation_reason = Some(reason);

    // RWA State更新
    let rwa_state = &mut ctx.accounts.rwa_state;
    rwa_state.locked_at = None;
    rwa_state.lock_reason = Some("Thawed: Conditions not met or admin decision".to_string());

    msg!("✅ NFT successfully thawed");
    msg!("🔥 Physical freeze removed - NFT is now transferable");
    msg!("📊 Status: Created (back to initial state)");
    
    Ok(())
}

/// 交換リクエスト取得
pub fn get_exchange_request_by_id(
    ctx: Context<GetExchangeRequestById>,
) -> Result<ExchangeRequest> {
    let exchange_request = &ctx.accounts.exchange_request;
    
    let exchange_data = ExchangeRequest {
        owner: exchange_request.owner,
        request_id: exchange_request.request_id.clone(),
        nft_mint: exchange_request.nft_mint,
        shipping_fee: exchange_request.shipping_fee,
        status: exchange_request.status.clone(),
        deposit_amount: exchange_request.deposit_amount,
        tracking_info: exchange_request.tracking_info.clone(),
        timestamp: exchange_request.timestamp,
        admin_authority: exchange_request.admin_authority,
        cancellation_reason: exchange_request.cancellation_reason.clone(),
        deposit_token_type: exchange_request.deposit_token_type.clone(),
        deposit_token_mint: exchange_request.deposit_token_mint.clone(),
    };
    
    Ok(exchange_data)
}

/// 交換リクエスト返金（管理者のみ）
pub fn refund_exchange_request(
    ctx: Context<RefundExchangeRequest>,
    refund_reason: String,
) -> Result<()> {
    let exchange_request = &mut ctx.accounts.exchange_request;
    
    msg!("Admin refunding exchange request: {}", exchange_request.request_id);
    msg!("Current status: {:?}", exchange_request.status);
    msg!("Deposit amount: {}", exchange_request.deposit_amount);
    msg!("Refund reason: {}", refund_reason);

    // 発送前のみ返金可能
    require!(
        exchange_request.status == ExchangeStatus::Created || 
        exchange_request.status == ExchangeStatus::Funded,
        CustomErrorCode::CannotRefundAfterShipping
    );

    // デポジット金額が0より大きいかチェック
    require!(
        exchange_request.deposit_amount > 0,
        CustomErrorCode::NoFundsToRefund
    );

    let refund_amount = exchange_request.deposit_amount;

    // デポジットタイプに応じて払い戻し処理を分岐
    match exchange_request.deposit_token_type {
        DepositTokenType::Sol => {
            msg!("Refunding {} SOL", refund_amount as f64 / 1_000_000_000.0);
            
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.deposit_account.to_account_info(),
                        to: ctx.accounts.owner.to_account_info(),
                    },
                ),
                refund_amount,
            )?;
        },
        DepositTokenType::Usdt | DepositTokenType::Usdc => {
            msg!("Refunding {} tokens", refund_amount);
            
            require!(
                ctx.accounts.deposit_token_account.is_some() && 
                ctx.accounts.user_token_account.is_some(),
                CustomErrorCode::TokenAccountNotProvided
            );
            
            let deposit_token_account = ctx.accounts.deposit_token_account.as_ref().unwrap();
            let user_token_account = ctx.accounts.user_token_account.as_ref().unwrap();
            
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.as_ref().unwrap().to_account_info(),
                    token::Transfer {
                        from: deposit_token_account.to_account_info(),
                        to: user_token_account.to_account_info(),
                        authority: ctx.accounts.deposit_account.to_account_info(),
                    },
                ),
                refund_amount,
            )?;
        },
    }

    // Exchange Request更新
    exchange_request.deposit_amount = 0;
    exchange_request.status = ExchangeStatus::Refunded;
    exchange_request.cancellation_reason = Some(refund_reason.clone());

    msg!("✅ Exchange request refund completed successfully");
    msg!("Refunded amount: {}", refund_amount);
    msg!("Exchange status updated to: Refunded");
    
    Ok(())
}

/// 交換リクエストが必要なデポジット額に達しているかを確認する
pub fn is_exchange_request_funded(
    ctx: Context<CheckExchangeRequestFunded>,
) -> Result<bool> {
    let exchange_request = &ctx.accounts.exchange_request;
    
    msg!("Checking exchange request funding status");
    msg!("Request ID: {}", exchange_request.request_id);
    msg!("Current status: {:?}", exchange_request.status);
    msg!("Required shipping fee: {}", exchange_request.shipping_fee);
    msg!("Deposited amount: {}", exchange_request.deposit_amount);
    
    // ステータスがFundedの場合は即座にtrue
    if exchange_request.status == ExchangeStatus::Funded {
        msg!("✅ Exchange request is already marked as Funded");
        return Ok(true);
    }
    
    // デポジット額が必要送料以上かチェック
    let is_funded = exchange_request.deposit_amount >= exchange_request.shipping_fee;
    
    if is_funded {
        msg!("✅ Exchange request has sufficient deposit ({} >= {})", 
             exchange_request.deposit_amount, 
             exchange_request.shipping_fee);
    } else {
        msg!("❌ Exchange request is underfunded ({} < {})", 
             exchange_request.deposit_amount, 
             exchange_request.shipping_fee);
    }
    
    Ok(is_funded)
}

#[derive(Accounts)]
pub struct DepositShippingFee<'info> {
    #[account(
        mut,
        seeds = [b"exchange_request", exchange_request.owner.as_ref(), exchange_request.request_id.as_bytes()],
        bump
    )]
    pub exchange_request: Account<'info, ExchangeRequest>,
    
    #[account(
        mut,
        seeds = [b"rwa_state", mint.key().as_ref()],
        bump,
        has_one = owner @ CustomErrorCode::Unauthorized
    )]
    pub rwa_state: Account<'info, RwaState>,
    
    #[account(seeds = [b"config"], bump)]
    pub global_config: Account<'info, GlobalConfig>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        constraint = mint.key() == exchange_request.nft_mint
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = deposit_account.key() == global_config.deposit_target @ CustomErrorCode::InvalidDepositAccount
    )]
    /// CHECK: このアカウントはグローバル設定で指定された収集アカウントです（送料用）
    pub deposit_account: AccountInfo<'info>,
    
    /// ユーザーのトークンアカウント（USDT/USDC用、オプション）
    #[account(mut)]
    pub user_token_account: Option<Account<'info, TokenAccount>>,
    
    /// デポジット先のトークンアカウント（USDT/USDC用、オプション）
    #[account(mut)]
    pub deposit_token_account: Option<Account<'info, TokenAccount>>,
    
    /// トークンプログラム（USDT/USDC用、オプション）
    pub token_program: Option<Program<'info, Token>>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(nft_owner: Pubkey, request_id: String)]
pub struct CreateExchangeRequestWithFreeze<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 4 + request_id.len() + 32 + 8 + 1 + 8 + 4 + 100 + 8 + 32 + 1 + 33 + 4 + 100,
        seeds = [b"exchange_request", nft_owner.as_ref(), request_id.as_bytes()],
        bump
    )]
    pub exchange_request: Account<'info, ExchangeRequest>,
    
    #[account(
        mut,
        seeds = [b"rwa_state", mint.key().as_ref()],
        bump,
        has_one = owner @ CustomErrorCode::Unauthorized
    )]
    pub rwa_state: Account<'info, RwaState>,
    
    #[account(
        mut,
        seeds = [b"config"],
        bump,
        has_one = admin @ CustomErrorCode::Unauthorized
    )]
    pub global_config: Account<'info, GlobalConfig>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// CHECK: Exchange requestのowner
    #[account(address = nft_owner)]
    pub owner: UncheckedAccount<'info>,
    
    #[account(
        mut,
        constraint = token_account.mint == mint.key(),
        constraint = token_account.owner == nft_owner
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = mint.freeze_authority.unwrap() == admin.key() @ CustomErrorCode::Unauthorized
    )]
    pub mint: Account<'info, Mint>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ThawNftConditional<'info> {
    #[account(
        mut,
        seeds = [b"exchange_request", exchange_request.owner.as_ref(), exchange_request.request_id.as_bytes()],
        bump
    )]
    pub exchange_request: Account<'info, ExchangeRequest>,
    
    #[account(
        mut,
        seeds = [b"rwa_state", mint.key().as_ref()],
        bump
    )]
    pub rwa_state: Account<'info, RwaState>,
    
    #[account(
        seeds = [b"config"],
        bump,
        has_one = admin @ CustomErrorCode::Unauthorized
    )]
    pub global_config: Account<'info, GlobalConfig>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        mut,
        constraint = token_account.mint == mint.key(),
        constraint = token_account.owner == exchange_request.owner
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = mint.key() == exchange_request.nft_mint,
        constraint = mint.freeze_authority.unwrap() == admin.key() @ CustomErrorCode::Unauthorized
    )]
    pub mint: Account<'info, Mint>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetExchangeRequestById<'info> {
    #[account()]
    pub exchange_request: Account<'info, ExchangeRequest>,
}

#[derive(Accounts)]
pub struct RefundExchangeRequest<'info> {
    #[account(
        mut,
        seeds = [b"exchange_request", exchange_request.owner.as_ref(), exchange_request.request_id.as_bytes()],
        bump
    )]
    pub exchange_request: Account<'info, ExchangeRequest>,
    
    #[account(
        seeds = [b"config"],
        bump,
        has_one = admin @ CustomErrorCode::Unauthorized
    )]
    pub global_config: Account<'info, GlobalConfig>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// CHECK: Exchange requestのowner（返金先）
    #[account(
        mut,
        address = exchange_request.owner
    )]
    pub owner: UncheckedAccount<'info>,
    
    #[account(
        mut,
        constraint = deposit_account.key() == global_config.deposit_target @ CustomErrorCode::InvalidDepositAccount
    )]
    /// CHECK: このアカウントはグローバル設定で指定された収集アカウントです（refund時は署名が必要）
    pub deposit_account: Signer<'info>,
    
    /// ユーザーのトークンアカウント（USDT/USDC用、オプション）
    #[account(mut)]
    pub user_token_account: Option<Account<'info, TokenAccount>>,
    
    /// デポジット先のトークンアカウント（USDT/USDC用、オプション）
    #[account(mut)]
    pub deposit_token_account: Option<Account<'info, TokenAccount>>,
    
    /// トークンプログラム（USDT/USDC用、オプション）
    pub token_program: Option<Program<'info, Token>>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CheckExchangeRequestFunded<'info> {
    #[account(
        seeds = [b"exchange_request", exchange_request.owner.as_ref(), exchange_request.request_id.as_bytes()],
        bump
    )]
    pub exchange_request: Account<'info, ExchangeRequest>,
}

 
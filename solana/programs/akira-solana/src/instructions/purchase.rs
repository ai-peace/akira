use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Token};

use crate::state::*;
use crate::errors::ErrorCode as CustomErrorCode;

/// 購入リクエストを作成（管理者のみ）
pub fn create_purchase_request(
    ctx: Context<CreatePurchaseRequest>,
    target_user: Pubkey,
    request_id: String,
    metadata_uri: String,
    price_estimate: u64,
    deposit_token_type: DepositTokenType,
    deposit_token_mint: Option<Pubkey>,
) -> Result<()> {
    msg!("Admin creating purchase request for user: {}", target_user);
    msg!("Request ID: {}, Price: {} SOL", request_id, price_estimate as f64 / 1_000_000_000.0);

    // トークンタイプとミントアドレスの整合性チェック
    match deposit_token_type {
        DepositTokenType::Sol => {
            require!(deposit_token_mint.is_none(), CustomErrorCode::InvalidDepositTokenType);
        },
        DepositTokenType::Usdt | DepositTokenType::Usdc => {
            require!(deposit_token_mint.is_some(), CustomErrorCode::TokenAccountNotProvided);
        },
    }

    let purchase_request = &mut ctx.accounts.purchase_request;
    purchase_request.owner = target_user; // 指定されたユーザーがオーナー
    purchase_request.request_id = request_id;
    purchase_request.metadata_uri = metadata_uri;
    purchase_request.price_estimate = price_estimate;
    purchase_request.status = PurchaseRequestStatus::Created;
    purchase_request.deposit_amount = 0;
    purchase_request.rwa_mint = None;
    purchase_request.timestamp = Clock::get()?.unix_timestamp;
    purchase_request.admin_authority = ctx.accounts.admin.key();
    purchase_request.deposit_token_type = deposit_token_type;
    purchase_request.deposit_token_mint = deposit_token_mint;
    
    msg!("✅ Purchase request created successfully by admin");
    Ok(())
}

/// 購入リクエストの返金処理（管理者のみ）
pub fn refund_purchase_request(
    ctx: Context<RefundPurchaseRequest>,
    refund_reason: String,
) -> Result<()> {
    let purchase_request = &mut ctx.accounts.purchase_request;
    
    msg!("Admin refunding purchase request: {}", purchase_request.request_id);
    msg!("Current status: {:?}", purchase_request.status);
    msg!("Deposit amount: {} SOL", purchase_request.deposit_amount as f64 / 1_000_000_000.0);
    msg!("Refund reason: {}", refund_reason);

    // 返金可能な状態かチェック
    require!(
                purchase_request.status == PurchaseRequestStatus::Created ||
        purchase_request.status == PurchaseRequestStatus::Funded,
        CustomErrorCode::InvalidPurchaseRequestStatus
    );

    // デポジット金額が0より大きいかチェック
    require!(
        purchase_request.deposit_amount > 0,
        CustomErrorCode::NoFundsToRefund
    );

    let refund_amount = purchase_request.deposit_amount;

    // デポジットタイプに応じて払い戻し処理を分岐
    match purchase_request.deposit_token_type {
        DepositTokenType::Sol => {
            msg!("Refunding {} SOL", refund_amount as f64 / 1_000_000_000.0);
            
            // SOLを払い戻し
            anchor_lang::system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    anchor_lang::system_program::Transfer {
                        from: ctx.accounts.deposit_account.to_account_info(),
                        to: ctx.accounts.owner.to_account_info(),
                    },
                ),
                refund_amount,
            )?;
        },
        DepositTokenType::Usdt | DepositTokenType::Usdc => {
            msg!("Refunding {} tokens", refund_amount);
            
            // トークンを払い戻し
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

    // 購入リクエストの状態を更新
    purchase_request.deposit_amount = 0;
    purchase_request.status = PurchaseRequestStatus::Refunded;
    purchase_request.cancellation_reason = Some(refund_reason.clone());

    msg!("✅ Refund completed successfully");
    msg!("Refunded amount: {} SOL", refund_amount as f64 / 1_000_000_000.0);
    msg!("Request status updated to: Refunded");
    
    Ok(())
}

/// SOL/USDT/USDCデポジットを受け付ける
pub fn deposit_funds(
    ctx: Context<DepositFunds>,
    amount: u64,
) -> Result<()> {
    let purchase_request = &mut ctx.accounts.purchase_request;
    
    // 返金済みの場合はデポジットを拒否
    require!(
        purchase_request.status != PurchaseRequestStatus::Refunded,
        CustomErrorCode::CannotDepositAfterRefund
    );
    
    // 完了済みの場合もデポジットを拒否
    require!(
        purchase_request.status != PurchaseRequestStatus::Completed,
        CustomErrorCode::CannotDepositAfterCompletion
    );

    msg!("Depositing to purchase request: {}", purchase_request.request_id);
    
    // デポジットタイプに応じて処理を分岐
    match purchase_request.deposit_token_type {
        DepositTokenType::Sol => {
            msg!("Depositing {} SOL", amount as f64 / 1_000_000_000.0);
            
            // SOLの場合：system_program::transferを使用
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
        },
        DepositTokenType::Usdt | DepositTokenType::Usdc => {
            msg!("Depositing {} tokens", amount);
            
            // トークンの場合：token_program::transferを使用
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
                amount,
            )?;
        },
    }

    // 購入リクエストの状態を更新
    purchase_request.deposit_amount = purchase_request.deposit_amount.checked_add(amount).unwrap();
    
    // 十分な額がデポジットされたら状態を更新
    if purchase_request.deposit_amount >= purchase_request.price_estimate {
        purchase_request.status = PurchaseRequestStatus::Funded;
        msg!("✅ Purchase request fully funded!");
    }

    msg!("Total deposited: {} SOL", purchase_request.deposit_amount as f64 / 1_000_000_000.0);

    Ok(())
}

/// 購入リクエストが必要なデポジット額に達しているかを確認する
pub fn is_purchase_request_funded(
    ctx: Context<CheckPurchaseRequestFunded>,
) -> Result<bool> {
    let purchase_request = &ctx.accounts.purchase_request;
    
    if purchase_request.status == PurchaseRequestStatus::Funded {
        return Ok(true);
    }
    
    Ok(purchase_request.deposit_amount >= purchase_request.price_estimate)
}

/// リクエストIDから購入リクエストを取得する
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
        deposit_token_type: purchase_request.deposit_token_type.clone(),
        deposit_token_mint: purchase_request.deposit_token_mint.clone(),
    };
    
    Ok(purchase_data)
}

/// オーナーとリクエストIDから購入リクエストPDAを検索する
pub fn find_purchase_request(
    _ctx: Context<FindPurchaseRequest>,
    owner: Pubkey,
    request_id: String,
) -> Result<Pubkey> {
    let (pda, _bump) = Pubkey::find_program_address(
        &[
            b"purchase_request",
            owner.as_ref(),
            request_id.as_bytes(),
        ],
        &crate::ID,
    );
    
    Ok(pda)
}

// Context structures

#[derive(Accounts)]
#[instruction(target_user: Pubkey, request_id: String, metadata_uri: String, price_estimate: u64, deposit_token_type: DepositTokenType, deposit_token_mint: Option<Pubkey>)]
pub struct CreatePurchaseRequest<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 4 + request_id.len() + 4 + metadata_uri.len() + 8 + 1 + 8 + 33 + 4 + 100 + 4 + 50 + 8 + 32 + 1 + 33,
        seeds = [b"purchase_request", target_user.as_ref(), request_id.as_bytes()],
        bump
    )]
    pub purchase_request: Account<'info, PurchaseRequest>,
    
    #[account(
        mut,
        seeds = [b"config"],
        bump,
        has_one = admin @ CustomErrorCode::Unauthorized
    )]
    pub global_config: Account<'info, GlobalConfig>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositFunds<'info> {
    #[account(
        mut,
        has_one = owner @ CustomErrorCode::Unauthorized,
    )]
    pub purchase_request: Account<'info, PurchaseRequest>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(seeds = [b"config"], bump)]
    pub global_config: Account<'info, GlobalConfig>,
    
    #[account(
        mut,
        constraint = deposit_account.key() == global_config.deposit_target @ CustomErrorCode::InvalidDepositAccount
    )]
    /// CHECK: このアカウントはグローバル設定で指定された収集アカウントです（SOL用）
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
pub struct CheckPurchaseRequestFunded<'info> {
    #[account()]
    pub purchase_request: Account<'info, PurchaseRequest>,
}

#[derive(Accounts)]
pub struct GetPurchaseRequestById<'info> {
    #[account()]
    pub purchase_request: Account<'info, PurchaseRequest>,
}

#[derive(Accounts)]
pub struct FindPurchaseRequest<'info> {
    /// CHECK: プログラムIDの取得のみに使用
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundPurchaseRequest<'info> {
    #[account(
        mut,
        seeds = [b"purchase_request", purchase_request.owner.as_ref(), purchase_request.request_id.as_bytes()],
        bump
    )]
    pub purchase_request: Account<'info, PurchaseRequest>,
    
    #[account(
        seeds = [b"config"],
        bump,
        has_one = admin @ CustomErrorCode::Unauthorized
    )]
    pub global_config: Account<'info, GlobalConfig>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// CHECK: Purchase requestのowner（返金先）
    #[account(
        mut,
        address = purchase_request.owner
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
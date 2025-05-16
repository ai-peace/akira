use anchor_lang::prelude::*;

declare_id!("7imdRzjtg5ao34crVKZSfudYiaZtFXa4Y65tFGQWQETg");

#[program]
pub mod akira_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    // グローバル設定の初期化
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        deposit_target: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.global_config;
        config.admin = ctx.accounts.admin.key();
        config.deposit_target = deposit_target;
        Ok(())
    }

    // 送付先更新命令（管理者のみ）
    pub fn update_deposit_target(
        ctx: Context<UpdateConfig>,
        new_deposit_target: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.global_config;
        config.deposit_target = new_deposit_target;
        Ok(())
    }

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

    // SOLデポジットを受け付ける
    pub fn deposit_funds(
        ctx: Context<DepositFunds>,
        amount: u64,
    ) -> Result<()> {
        // 設定からデポジット先を取得（すでにアカウント制約で検証済み）
        
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

    // 購入リクエストが必要なデポジット額に達しているかを確認する
    pub fn is_purchase_request_funded(
        ctx: Context<CheckPurchaseRequestFunded>,
    ) -> Result<bool> {
        let purchase_request = &ctx.accounts.purchase_request;
        
        // ステータスがFundedかどうか直接チェック
        if purchase_request.status == RequestStatus::Funded {
            return Ok(true);
        }
        
        // 金額が条件を満たしているかチェック（状態がまだ更新されていない可能性もある）
        Ok(purchase_request.deposit_amount >= purchase_request.price_estimate)
    }

    // リクエストIDから購入リクエストを取得する
    pub fn get_purchase_request_by_id(
        ctx: Context<GetPurchaseRequestById>,
    ) -> Result<PurchaseRequest> {
        let purchase_request = &ctx.accounts.purchase_request;
        
        // アカウントの内容をそのまま返す
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

    // オーナーとリクエストIDから購入リクエストPDAを検索する
    pub fn find_purchase_request(
        ctx: Context<FindPurchaseRequest>,
        owner: Pubkey,
        request_id: String,
    ) -> Result<Pubkey> {
        // PDAを計算
        let (pda, _bump) = Pubkey::find_program_address(
            &[
                b"purchase_request",
                owner.as_ref(),
                request_id.as_bytes(),
            ],
            &ctx.program_id,
        );
        
        // 計算されたPDAを返す
        Ok(pda)
    }
}

#[derive(Accounts)]
pub struct Initialize {}

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
    
    // 設定アカウントを追加
    #[account(seeds = [b"config"], bump)]
    pub global_config: Account<'info, GlobalConfig>,
    
    // deposit_accountが設定と一致することを検証
    #[account(
        mut,
        constraint = deposit_account.key() == global_config.deposit_target @ ErrorCode::InvalidDepositAccount
    )]
    /// CHECK: このアカウントはグローバル設定で指定された収集アカウントです
    pub deposit_account: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
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
} 
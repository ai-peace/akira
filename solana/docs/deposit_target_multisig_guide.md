# Deposit Target マルチシグ実装ガイド

## 🔐 **セキュリティレベル比較**

| アプローチ      | セキュリティ | 複雑性     | ガス効率 | 管理性 |
| --------------- | ------------ | ---------- | -------- | ------ |
| 単一 Keypair    | ⭐⭐         | ⭐         | ⭐⭐⭐   | ⭐⭐⭐ |
| Solana Multisig | ⭐⭐⭐⭐     | ⭐⭐⭐     | ⭐⭐     | ⭐⭐   |
| Squads Protocol | ⭐⭐⭐⭐⭐   | ⭐⭐       | ⭐⭐     | ⭐⭐⭐ |
| カスタム実装    | ⭐⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐       | ⭐     |

## 🚀 **1. Solana 標準 Multisig（推奨）**

### **Setup 手順**

```typescript
import { Multisig, createMultisig } from "@solana/web3.js";

// 3-of-5 マルチシグ作成
const signers = [
  admin1.publicKey,
  admin2.publicKey,
  admin3.publicKey,
  admin4.publicKey,
  admin5.publicKey,
];

const multisigAccount = await createMultisig(
  connection,
  payer,
  signers,
  3 // required signatures
);
```

### **Deposit Target 更新**

```typescript
// マルチシグをdeposit targetに設定
await program.methods
  .updateDepositTarget(multisigAccount.publicKey)
  .accounts({
    globalConfig: globalConfigPda,
    admin: wallet.publicKey,
  })
  .rpc();
```

### **Refund 処理（3 署名必要）**

```typescript
// TransactionInstruction作成
const refundIx = await program.methods
  .refundPurchaseRequest("Multisig approved refund")
  .accounts({
    purchaseRequest: purchaseRequestPda,
    globalConfig: globalConfigPda,
    admin: admin.publicKey,
    owner: userPublicKey,
    depositAccount: multisigAccount.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .instruction();

// マルチシグトランザクション作成
const multisigTx = new Transaction().add(refundIx);
const multisigInfo = await createTransaction(
  connection,
  multisigAccount.publicKey,
  [refundIx],
  payer
);

// 3人の管理者が署名
await approveTransaction(
  connection,
  multisigAccount.publicKey,
  multisigInfo.transaction,
  admin1
);
await approveTransaction(
  connection,
  multisigAccount.publicKey,
  multisigInfo.transaction,
  admin2
);
await approveTransaction(
  connection,
  multisigAccount.publicKey,
  multisigInfo.transaction,
  admin3
);

// 実行
await executeTransaction(
  connection,
  multisigAccount.publicKey,
  multisigInfo.transaction
);
```

## 🏢 **2. Squads Protocol（企業向け）**

### **Setup**

```bash
npm install @sqds/sdk
```

```typescript
import { Squads } from "@sqds/sdk";

// 企業級マルチシグ作成
const squads = new Squads({
  connection,
  wallet: adminWallet,
});

const multisig = await squads.createMultisig({
  members: [admin1, admin2, admin3, admin4, admin5],
  threshold: 3,
  name: "RWA Deposit Target Multisig",
});
```

### **利点**

- 🎯 **企業向け UI**: web interface
- 📊 **分析機能**: transaction analytics
- 🔄 **自動実行**: time-based execution
- 📱 **モバイル対応**: mobile signatures

## 🛠️ **3. カスタムマルチシグ実装**

### **Program 内実装**

```rust
#[derive(Accounts)]
pub struct MultisigDepositTarget<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 * 5 + 1 + 4, // 5 signers + threshold + nonce
        seeds = [b"multisig_deposit"],
        bump
    )]
    pub multisig: Account<'info, MultisigAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MultisigAccount {
    pub signers: [Pubkey; 5],
    pub threshold: u8,
    pub nonce: u32,
}

pub fn create_multisig_deposit_target(
    ctx: Context<MultisigDepositTarget>,
    signers: [Pubkey; 5],
    threshold: u8,
) -> Result<()> {
    let multisig = &mut ctx.accounts.multisig;
    multisig.signers = signers;
    multisig.threshold = threshold;
    multisig.nonce = 0;
    Ok(())
}
```

## 📋 **実装ロードマップ**

### **Phase 1: 基本マルチシグ（1 週間）**

- [ ] Solana 標準 multisig 導入
- [ ] update_deposit_target 修正
- [ ] テスト用スクリプト作成

### **Phase 2: セキュリティ強化（2 週間）**

- [ ] Time lock 機能追加
- [ ] Emergency pause 機能
- [ ] Audit trail 実装

### **Phase 3: Enterprise 機能（1 ヶ月）**

- [ ] Squads Protocol 統合
- [ ] Web 管理画面
- [ ] モニタリングシステム

## 🧪 **テストスクリプト例**

```typescript
// scripts/multisig/01_create_multisig_deposit.ts
import { createMultisig } from "@solana/web3.js";

const admin1 = Keypair.generate();
const admin2 = Keypair.generate();
const admin3 = Keypair.generate();

const multisig = await createMultisig(
  connection,
  payer,
  [admin1.publicKey, admin2.publicKey, admin3.publicKey],
  2 // 2-of-3
);

// Deposit targetに設定
await program.methods
  .updateDepositTarget(multisig.publicKey)
  .accounts({
    globalConfig: globalConfigPda,
    admin: wallet.publicKey,
  })
  .rpc();

console.log(`✅ Multisig Deposit Target: ${multisig.publicKey}`);
```

## 🔒 **セキュリティベストプラクティス**

### **推奨構成**

- **Threshold**: 3-of-5 または 2-of-3
- **Key Distribution**: 地理的分散
- **Backup Strategy**: 秘密鍵のセキュア保管
- **Rotation Policy**: 定期的なキー更新

### **アクセス制御**

```
Admin 1: 日本 (24h monitoring)
Admin 2: アメリカ (business hours)
Admin 3: ヨーロッパ (business hours)
Admin 4: Backup (emergency only)
Admin 5: Audit (read-only + emergency)
```

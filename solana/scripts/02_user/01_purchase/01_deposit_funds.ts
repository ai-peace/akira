import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { factoryProgramMethods, factoryPda } from "../../common/program-methods";
import { scriptConsts } from "../../consts/scriptConsts";

// 定数定義
const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"); // Devnet USDT
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC

async function main() {
  const requestId = process.argv[2];
  const depositAmount = process.argv[3]
    ? parseFloat(process.argv[3]) * LAMPORTS_PER_SOL
    : 0.1 * LAMPORTS_PER_SOL; // デフォルト0.1

  if (!requestId) {
    console.error("❌ Request ID is required");
    console.log(
      "Usage: pnpm tsx scripts/02_deposit/02_deposit_funds.ts <request_id> [amount]"
    );
    console.log(
      "Example: pnpm tsx scripts/02_deposit/02_deposit_funds.ts my-request-123 0.5"
    );
    console.log("Note: Amount unit depends on the token type (SOL/USDT/USDC)");
    process.exit(1);
  }

  const { program, wallet, keypair } = factoryProgramMethods();

  // Purchase Request PDA計算
  const [purchaseRequestPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("purchase_request"),
      wallet.publicKey.toBuffer(),
      Buffer.from(requestId),
    ],
    scriptConsts.PROGRAM_ID
  );

  // Global Config PDA計算
  const globalConfigPda = factoryPda(
    [Buffer.from("config")],
    scriptConsts.PROGRAM_ID
  );

  try {
    console.log(`🚀 Depositing funds to request: ${requestId}`);

    // Purchase Requestを取得してトークンタイプを確認
    // @ts-ignore
    const purchaseRequest = await program.account.purchaseRequest.fetch(
      purchaseRequestPda
    );

    const depositTokenType = Object.keys(purchaseRequest.depositTokenType)[0];
    console.log(`🪙 Deposit Token Type: ${depositTokenType.toUpperCase()}`);

    // Global Configからdeposit_targetを取得
    // @ts-ignore
    const globalConfig = await program.account.globalConfig.fetch(
      globalConfigPda
    );

    let accounts: any = {
      purchaseRequest: purchaseRequestPda,
      owner: wallet.publicKey,
      globalConfig: globalConfigPda,
      depositAccount: globalConfig.depositTarget,
      userTokenAccount: null,
      depositTokenAccount: null,
      tokenProgram: null,
      systemProgram: anchor.web3.SystemProgram.programId,
    };

    // トークンタイプに応じてアカウントを追加
    if (depositTokenType === "sol") {
      console.log(`💰 Amount: ${depositAmount / LAMPORTS_PER_SOL} SOL`);
      console.log(
        `🏦 Deposit Target: ${globalConfig.depositTarget.toString()}`
      );
      // SOLの場合はトークンアカウントはnullのまま
    } else {
      // USDT/USDCの場合
      const tokenMint = depositTokenType === "usdt" ? USDT_MINT : USDC_MINT;
      console.log(
        `💰 Amount: ${depositAmount} ${depositTokenType.toUpperCase()}`
      );
      console.log(`🏦 Token Mint: ${tokenMint.toString()}`);

      // ユーザーのトークンアカウント（Associated Token Account）
      const userTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        wallet.publicKey
      );

      // デポジット先のトークンアカウント（この例では管理者のATA）
      const depositTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        globalConfig.depositTarget
      );

      console.log(`👤 User Token Account: ${userTokenAccount.toString()}`);
      console.log(
        `🏦 Deposit Token Account: ${depositTokenAccount.toString()}`
      );

      // トークン関連のアカウントを追加
      accounts.userTokenAccount = userTokenAccount;
      accounts.depositTokenAccount = depositTokenAccount;
      accounts.tokenProgram = TOKEN_PROGRAM_ID;
    }

    console.log(`📍 Purchase Request PDA: ${purchaseRequestPda.toString()}`);

    const tx = await program.methods
      .depositFunds(new anchor.BN(depositAmount))
      .accounts(accounts as any)
      .signers([keypair])
      .rpc();

    console.log(`✅ Funds deposited successfully!`);
    console.log(
      `📝 Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );

    // 更新後の状態を確認
    // @ts-ignore
    const updatedRequest = await program.account.purchaseRequest.fetch(
      purchaseRequestPda
    );
    console.log(`\n📊 Updated Purchase Request Status:`);

    if (depositTokenType === "sol") {
      console.log(
        `• Total Deposited: ${
          updatedRequest.depositAmount.toNumber() / LAMPORTS_PER_SOL
        } SOL`
      );
      console.log(
        `• Price Estimate: ${
          updatedRequest.priceEstimate.toNumber() / LAMPORTS_PER_SOL
        } SOL`
      );
    } else {
      console.log(
        `• Total Deposited: ${updatedRequest.depositAmount.toNumber()} ${depositTokenType.toUpperCase()}`
      );
      console.log(
        `• Price Estimate: ${updatedRequest.priceEstimate.toNumber()} ${depositTokenType.toUpperCase()}`
      );
    }

    console.log(`• Status: ${Object.keys(updatedRequest.status)[0]}`);
    console.log(`• Token Type: ${depositTokenType.toUpperCase()}`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

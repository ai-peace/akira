import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AkiraSolana } from "../../../target/types/akira_solana";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

// 定数定義
const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"); // Devnet USDT
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC

async function main() {
  console.log("🔄 Purchase Request Refund Test Starting...");

  // Anchor設定
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.AkiraSolana as Program<AkiraSolana>;

  try {
    // ハードコードされた設定値（デプロイ時に表示された値を使用）
    const adminKeypair = provider.wallet.payer; // ウォレットから直接取得
    const globalConfigPda = new PublicKey(
      "H5N6wqqRB5jKuCK2B2oUXcVmAQSmcewnQccEnHTsEeUQ"
    );
    const depositTargetPublicKey = new PublicKey(
      "6YPuq2YZDW5PFdVdN8r8Af1moTKD3JG3PT691SPqsKEi"
    );

    // Purchase Request の情報
    const targetUser = new PublicKey(
      "kLVTJRLJPif8QexEZZiobhyLXA9Gqvhziv7DXdVuNgE"
    );
    const requestId = "refund-test-v2";
    const purchaseRequestPda = new PublicKey(
      "7zr7p1YVRMXHEfg2GR9g64XSRU9sjgfvCeuL8fDAADDe"
    );

    // Deposit Target Keypairを読み込み
    const depositTargetKeypairData = JSON.parse(
      require("fs").readFileSync("/tmp/deposit_target.json", "utf8")
    );
    const depositTargetKeypair = Keypair.fromSecretKey(
      new Uint8Array(depositTargetKeypairData)
    );

    console.log("📊 Account Information:");
    console.log(`Admin: ${adminKeypair.publicKey.toString()}`);
    console.log(`Target User: ${targetUser.toString()}`);
    console.log(`Deposit Target: ${depositTargetKeypair.publicKey.toString()}`);
    console.log(`Purchase Request PDA: ${purchaseRequestPda.toString()}`);

    // Purchase Request を取得してトークンタイプを確認
    const purchaseRequestAccount = await program.account.purchaseRequest.fetch(
      purchaseRequestPda
    );

    const depositTokenType = Object.keys(
      purchaseRequestAccount.depositTokenType
    )[0];
    console.log(`🪙 Deposit Token Type: ${depositTokenType.toUpperCase()}`);

    let accounts: any = {
      purchaseRequest: purchaseRequestPda,
      globalConfig: globalConfigPda,
      admin: adminKeypair.publicKey,
      owner: targetUser,
      depositAccount: depositTargetKeypair.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    };

    // トークンタイプに応じてアカウントと残高確認を追加
    if (depositTokenType === "sol") {
      // SOLの残高確認
      const targetUserBalanceBefore = await provider.connection.getBalance(
        targetUser
      );
      const depositAccountBalanceBefore = await provider.connection.getBalance(
        depositTargetKeypair.publicKey
      );

      console.log("\n💰 Pre-Refund Balances:");
      console.log(
        `Target User: ${targetUserBalanceBefore / LAMPORTS_PER_SOL} SOL`
      );
      console.log(
        `Deposit Account: ${depositAccountBalanceBefore / LAMPORTS_PER_SOL} SOL`
      );
    } else {
      // USDT/USDCの場合
      const tokenMint = depositTokenType === "usdt" ? USDT_MINT : USDC_MINT;
      console.log(`🏦 Token Mint: ${tokenMint.toString()}`);

      // ユーザーのトークンアカウント
      const userTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        targetUser
      );

      // デポジット先のトークンアカウント
      const depositTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        depositTargetKeypair.publicKey
      );

      console.log(`👤 User Token Account: ${userTokenAccount.toString()}`);
      console.log(
        `🏦 Deposit Token Account: ${depositTokenAccount.toString()}`
      );

      // トークン関連のアカウントを追加
      accounts.userTokenAccount = userTokenAccount;
      accounts.depositTokenAccount = depositTokenAccount;
      accounts.tokenProgram = TOKEN_PROGRAM_ID;

      // トークン残高確認
      try {
        const userTokenBalance =
          await provider.connection.getTokenAccountBalance(userTokenAccount);
        const depositTokenBalance =
          await provider.connection.getTokenAccountBalance(depositTokenAccount);

        console.log("\n💰 Pre-Refund Token Balances:");
        console.log(
          `Target User: ${
            userTokenBalance.value.uiAmount
          } ${depositTokenType.toUpperCase()}`
        );
        console.log(
          `Deposit Account: ${
            depositTokenBalance.value.uiAmount
          } ${depositTokenType.toUpperCase()}`
        );
      } catch (error) {
        console.log(
          "⚠️ Could not fetch token balances (accounts may not exist yet)"
        );
      }
    }

    console.log("\n📋 Purchase Request Status:");
    console.log(`Request ID: ${purchaseRequestAccount.requestId}`);
    console.log(
      `Current Status: ${JSON.stringify(purchaseRequestAccount.status)}`
    );

    if (depositTokenType === "sol") {
      console.log(
        `Deposit Amount: ${
          purchaseRequestAccount.depositAmount.toNumber() / LAMPORTS_PER_SOL
        } SOL`
      );
      console.log(
        `Price Estimate: ${
          purchaseRequestAccount.priceEstimate.toNumber() / LAMPORTS_PER_SOL
        } SOL`
      );
    } else {
      console.log(
        `Deposit Amount: ${purchaseRequestAccount.depositAmount.toNumber()} ${depositTokenType.toUpperCase()}`
      );
      console.log(
        `Price Estimate: ${purchaseRequestAccount.priceEstimate.toNumber()} ${depositTokenType.toUpperCase()}`
      );
    }

    // 返金処理実行
    const refundReason = "Test refund - admin decision";

    console.log("\n🔄 Executing refund...");
    const tx = await program.methods
      .refundPurchaseRequest(refundReason)
      .accounts(accounts as any)
      .signers([adminKeypair, depositTargetKeypair])
      .rpc();

    console.log(`✅ Refund transaction successful: ${tx}`);

    // 返金後の残高確認
    if (depositTokenType === "sol") {
      const targetUserBalanceAfter = await provider.connection.getBalance(
        targetUser
      );
      const depositAccountBalanceAfter = await provider.connection.getBalance(
        depositTargetKeypair.publicKey
      );

      console.log("\n💰 Post-Refund Balances:");
      console.log(
        `Target User: ${targetUserBalanceAfter / LAMPORTS_PER_SOL} SOL`
      );
      console.log(
        `Deposit Account: ${depositAccountBalanceAfter / LAMPORTS_PER_SOL} SOL`
      );
    } else {
      // トークン残高確認
      try {
        const userTokenAccount = await getAssociatedTokenAddress(
          depositTokenType === "usdt" ? USDT_MINT : USDC_MINT,
          targetUser
        );
        const depositTokenAccount = await getAssociatedTokenAddress(
          depositTokenType === "usdt" ? USDT_MINT : USDC_MINT,
          depositTargetKeypair.publicKey
        );

        const userTokenBalance =
          await provider.connection.getTokenAccountBalance(userTokenAccount);
        const depositTokenBalance =
          await provider.connection.getTokenAccountBalance(depositTokenAccount);

        console.log("\n💰 Post-Refund Token Balances:");
        console.log(
          `Target User: ${
            userTokenBalance.value.uiAmount
          } ${depositTokenType.toUpperCase()}`
        );
        console.log(
          `Deposit Account: ${
            depositTokenBalance.value.uiAmount
          } ${depositTokenType.toUpperCase()}`
        );
      } catch (error) {
        console.log("⚠️ Could not fetch post-refund token balances");
      }
    }

    // Purchase Request の最終状態確認
    const updatedPurchaseRequest = await program.account.purchaseRequest.fetch(
      purchaseRequestPda
    );
    console.log("\n📋 Updated Purchase Request Status:");
    console.log(`Status: ${JSON.stringify(updatedPurchaseRequest.status)}`);

    if (depositTokenType === "sol") {
      console.log(
        `Deposit Amount: ${
          updatedPurchaseRequest.depositAmount.toNumber() / LAMPORTS_PER_SOL
        } SOL`
      );
    } else {
      console.log(
        `Deposit Amount: ${updatedPurchaseRequest.depositAmount.toNumber()} ${depositTokenType.toUpperCase()}`
      );
    }

    console.log(
      `Cancellation Reason: ${updatedPurchaseRequest.cancellationReason}`
    );
    console.log(`Token Type: ${depositTokenType.toUpperCase()}`);

    // 返金後のデポジット試行テスト（失敗することを確認）
    console.log("\n🧪 Testing deposit after refund (should fail)...");
    try {
      const testDepositAmount =
        depositTokenType === "sol" ? 0.1 * LAMPORTS_PER_SOL : 100;

      const testAccounts: any = {
        purchaseRequest: purchaseRequestPda,
        owner: targetUser,
        globalConfig: globalConfigPda,
        depositAccount: depositTargetKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      };

      if (depositTokenType !== "sol") {
        const tokenMint = depositTokenType === "usdt" ? USDT_MINT : USDC_MINT;
        testAccounts.userTokenAccount = await getAssociatedTokenAddress(
          tokenMint,
          targetUser
        );
        testAccounts.depositTokenAccount = await getAssociatedTokenAddress(
          tokenMint,
          depositTargetKeypair.publicKey
        );
        testAccounts.tokenProgram = TOKEN_PROGRAM_ID;
      }

      await program.methods
        .depositFunds(new anchor.BN(testDepositAmount))
        .accounts(testAccounts as any)
        .signers([adminKeypair]) // 本来はtargetUserだが、テストのためadminで試行
        .rpc();

      console.log("❌ ERROR: Deposit should have failed after refund!");
    } catch (error: any) {
      console.log("✅ Deposit correctly rejected after refund");
      console.log(`Expected error: ${error.message}`);
    }

    console.log("\n🎉 Refund test completed successfully!");
  } catch (error) {
    console.error("❌ Error during refund test:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

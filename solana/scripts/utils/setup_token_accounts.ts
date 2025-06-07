import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMintToInstruction,
} from "@solana/spl-token";
import { factoryProgramMethods, factoryPda } from "../common/program-methods";
import { scriptConsts } from "../consts/scriptConsts";

// Devnet トークンミント
const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

async function main() {
  console.log("🛠️ Token Account Setup Script");

  const { program, wallet, keypair } = factoryProgramMethods();
  const connection = program.provider.connection;

  console.log(`👛 Wallet: ${wallet.publicKey.toString()}`);

  try {
    // Global Configを取得してdeposit targetを確認
    const globalConfigPda = factoryPda(
      [Buffer.from("config")],
      scriptConsts.PROGRAM_ID
    );

    // @ts-ignore
    const globalConfig = await program.account.globalConfig.fetch(
      globalConfigPda
    );
    console.log(`🏦 Deposit Target: ${globalConfig.depositTarget.toString()}`);

    // 処理するトークンリスト
    const tokens = [
      { name: "USDT", mint: USDT_MINT },
      { name: "USDC", mint: USDC_MINT },
    ];

    for (const token of tokens) {
      console.log(`\n🪙 Processing ${token.name}...`);

      // ユーザーのトークンアカウント
      const userTokenAccount = await getAssociatedTokenAddress(
        token.mint,
        wallet.publicKey
      );

      // デポジット先のトークンアカウント
      const depositTokenAccount = await getAssociatedTokenAddress(
        token.mint,
        globalConfig.depositTarget
      );

      console.log(
        `👤 User ${token.name} Account: ${userTokenAccount.toString()}`
      );
      console.log(
        `🏦 Deposit ${token.name} Account: ${depositTokenAccount.toString()}`
      );

      // ユーザーアカウントの存在確認
      const userAccountInfo = await connection.getAccountInfo(userTokenAccount);
      if (!userAccountInfo) {
        console.log(`⚠️ User ${token.name} account does not exist`);
        console.log(
          `📝 Create with: spl-token create-account ${token.mint.toString()} --url devnet`
        );
      } else {
        try {
          const balance = await connection.getTokenAccountBalance(
            userTokenAccount
          );
          console.log(
            `✅ User ${token.name} Balance: ${balance.value.uiAmount} ${token.name}`
          );
        } catch (error) {
          console.log(`⚠️ Could not fetch ${token.name} balance`);
        }
      }

      // デポジットアカウントの存在確認
      const depositAccountInfo = await connection.getAccountInfo(
        depositTokenAccount
      );
      if (!depositAccountInfo) {
        console.log(`⚠️ Deposit ${token.name} account does not exist`);
        console.log(
          `📝 Admin should create: spl-token create-account ${token.mint.toString()} --owner ${globalConfig.depositTarget.toString()} --url devnet`
        );
      } else {
        try {
          const balance = await connection.getTokenAccountBalance(
            depositTokenAccount
          );
          console.log(
            `✅ Deposit ${token.name} Balance: ${balance.value.uiAmount} ${token.name}`
          );
        } catch (error) {
          console.log(`⚠️ Could not fetch deposit ${token.name} balance`);
        }
      }
    }

    console.log("\n🌐 How to get test tokens:");
    console.log("1. USDC Faucet: https://faucet.circle.com/");
    console.log("2. Alternative: https://spl-token-faucet.com/");
    console.log("3. SPL Token CLI commands:");
    console.log("");

    console.log("# Install SPL Token CLI (if not installed):");
    console.log("cargo install spl-token-cli");
    console.log("");

    console.log("# Create user token accounts:");
    tokens.forEach((token) => {
      console.log(
        `spl-token create-account ${token.mint.toString()} --url devnet`
      );
    });
    console.log("");

    console.log("# Create deposit target token accounts (admin only):");
    tokens.forEach((token) => {
      console.log(
        `spl-token create-account ${token.mint.toString()} --owner ${globalConfig.depositTarget.toString()} --url devnet`
      );
    });
    console.log("");

    console.log("# Check all token accounts:");
    console.log("spl-token accounts --url devnet");

    console.log("\n📋 Next steps to test USDT/USDC deposits:");
    console.log("1. Create token accounts using the commands above");
    console.log("2. Get test tokens from faucets");
    console.log("3. Create USDT/USDC purchase requests:");
    console.log(
      "   pnpm tsx scripts/02_deposit/01_create_purchase_request.ts <user> <id> <amount> <uri> usdt"
    );
    console.log(
      "   pnpm tsx scripts/02_deposit/01_create_purchase_request.ts <user> <id> <amount> <uri> usdc"
    );
    console.log("4. Deposit tokens:");
    console.log(
      "   pnpm tsx scripts/02_deposit/02_deposit_funds.ts <request_id> <amount>"
    );
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Devnet トークンミント
const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

async function main() {
  console.log("🚰 Devnet Token Setup Helper");

  // Anchor設定
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = new Connection(clusterApiUrl("devnet"));
  const wallet = provider.wallet;

  console.log(`👛 Wallet: ${wallet.publicKey.toString()}`);

  try {
    // USDT トークンアカウント確認・作成
    const usdtTokenAccount = await getAssociatedTokenAddress(
      USDT_MINT,
      wallet.publicKey
    );

    console.log(`\n🪙 USDT Token Account: ${usdtTokenAccount.toString()}`);

    try {
      const usdtAccount = await connection.getAccountInfo(usdtTokenAccount);
      if (usdtAccount) {
        const balance = await connection.getTokenAccountBalance(
          usdtTokenAccount
        );
        console.log(
          `✅ USDT Account exists, Balance: ${balance.value.uiAmount} USDT`
        );
      } else {
        console.log("⚠️ USDT Token Account does not exist");
        console.log("📝 To create USDT account, run:");
        console.log(
          `spl-token create-account ${USDT_MINT.toString()} --url devnet`
        );
      }
    } catch (error) {
      console.log("⚠️ USDT Token Account does not exist");
      console.log("📝 To create USDT account, run:");
      console.log(
        `spl-token create-account ${USDT_MINT.toString()} --url devnet`
      );
    }

    // USDC トークンアカウント確認・作成
    const usdcTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      wallet.publicKey
    );

    console.log(`\n💵 USDC Token Account: ${usdcTokenAccount.toString()}`);

    try {
      const usdcAccount = await connection.getAccountInfo(usdcTokenAccount);
      if (usdcAccount) {
        const balance = await connection.getTokenAccountBalance(
          usdcTokenAccount
        );
        console.log(
          `✅ USDC Account exists, Balance: ${balance.value.uiAmount} USDC`
        );
      } else {
        console.log("⚠️ USDC Token Account does not exist");
        console.log("📝 To create USDC account, run:");
        console.log(
          `spl-token create-account ${USDC_MINT.toString()} --url devnet`
        );
      }
    } catch (error) {
      console.log("⚠️ USDC Token Account does not exist");
      console.log("📝 To create USDC account, run:");
      console.log(
        `spl-token create-account ${USDC_MINT.toString()} --url devnet`
      );
    }

    console.log("\n🌐 Token Faucets:");
    console.log("USDC Faucet: https://faucet.circle.com/");
    console.log("Alternative: https://spl-token-faucet.com/");

    console.log("\n📋 Manual Commands:");
    console.log("# Install SPL Token CLI:");
    console.log("cargo install spl-token-cli");
    console.log("");
    console.log("# Create token accounts:");
    console.log(
      `spl-token create-account ${USDT_MINT.toString()} --url devnet`
    );
    console.log(
      `spl-token create-account ${USDC_MINT.toString()} --url devnet`
    );
    console.log("");
    console.log("# Check balances:");
    console.log("spl-token accounts --url devnet");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

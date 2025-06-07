#!/usr/bin/env tsx
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { AkiraSolana } from "../../../target/types/akira_solana";
import {
  PublicKey,
  Keypair,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import fs from "fs";

// 🔧 設定
const DEVNET = true;
const connection = new Connection(
  DEVNET ? clusterApiUrl("devnet") : clusterApiUrl("mainnet-beta"),
  "confirmed"
);

// 🔑 Keypair読み込み
function loadKeypair(filePath: string): Keypair {
  const keypairFile = fs.readFileSync(filePath, "utf8");
  const keypairData = JSON.parse(keypairFile);
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
}

/**
 * 🚀 Exchange Request作成 + 即座フリーズ スクリプト
 *
 * 使用方法:
 * npx tsx scripts/04_exchange/01_create_exchange_with_freeze.ts <nft_owner> <request_id> <nft_mint> <shipping_fee_sol> [token_type]
 *
 * 例:
 * npx tsx scripts/04_exchange/01_create_exchange_with_freeze.ts kLVTJRLJPif8QexEZZiobhyLXA9Gqvhziv7DXdVuNgE "exchange-001" D6bpGsDAWhJvWiC7zVwRbNVS6Vo9thRaGNccirinZb3o 0.005 Sol
 */

async function main() {
  // コマンドライン引数
  const nftOwnerStr = process.argv[2];
  const requestId = process.argv[3];
  const nftMintStr = process.argv[4];
  const shippingFeeSolStr = process.argv[5];
  const tokenTypeStr = process.argv[6] || "Sol";

  if (!nftOwnerStr || !requestId || !nftMintStr || !shippingFeeSolStr) {
    console.error(
      "❌ 使用方法: npx tsx scripts/04_exchange/01_create_exchange_with_freeze.ts <nft_owner> <request_id> <nft_mint> <shipping_fee_sol> [token_type]"
    );
    console.error(
      "例: npx tsx scripts/04_exchange/01_create_exchange_with_freeze.ts kLVTJRLJPif8QexEZZiobhyLXA9Gqvhziv7DXdVuNgE exchange-001 D6bpGsDA... 0.005 Sol"
    );
    process.exit(1);
  }

  const nftOwner = new PublicKey(nftOwnerStr);
  const nftMint = new PublicKey(nftMintStr);
  const shippingFeeLamports = Math.floor(
    parseFloat(shippingFeeSolStr) * LAMPORTS_PER_SOL
  );

  // トークンタイプ設定
  let depositTokenType: any;
  let depositTokenMint: PublicKey | null = null;

  switch (tokenTypeStr.toLowerCase()) {
    case "sol":
      depositTokenType = { sol: {} };
      break;
    case "usdt":
      depositTokenType = { usdt: {} };
      depositTokenMint = new PublicKey(
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
      ); // Devnet USDT
      break;
    case "usdc":
      depositTokenType = { usdc: {} };
      depositTokenMint = new PublicKey(
        "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
      ); // Devnet USDC
      break;
    default:
      console.error("❌ 無効なトークンタイプ:", tokenTypeStr);
      console.error("利用可能: Sol, Usdt, Usdc");
      process.exit(1);
  }

  const adminKeypair = loadKeypair("/Users/nycrt/.config/solana/id.json");

  console.log(`🚀 Exchange Request作成 + 即座フリーズ`);
  console.log(`====================================`);
  console.log(`Admin: ${adminKeypair.publicKey.toBase58()}`);
  console.log(`NFT Owner: ${nftOwner.toBase58()}`);
  console.log(`Request ID: ${requestId}`);
  console.log(`NFT Mint: ${nftMint.toBase58()}`);
  console.log(
    `Shipping Fee: ${shippingFeeLamports} lamports (${shippingFeeSolStr} SOL)`
  );
  console.log(`Token Type: ${tokenTypeStr}`);

  // Provider設定
  const wallet = new Wallet(adminKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = anchor.workspace.AkiraSolana as Program<AkiraSolana>;
  console.log(`📋 Program ID: ${program.programId.toBase58()}`);

  try {
    // PDA計算
    const [globalConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    const [rwaStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("rwa_state"), nftMint.toBuffer()],
      program.programId
    );

    const [exchangeRequestPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("exchange_request"),
        nftOwner.toBuffer(),
        Buffer.from(requestId),
      ],
      program.programId
    );

    // Token Account計算
    const tokenAccount = getAssociatedTokenAddressSync(nftMint, nftOwner);

    console.log(`\n🏛️ PDAs:`);
    console.log(`Global Config: ${globalConfigPda.toBase58()}`);
    console.log(`RWA State: ${rwaStatePda.toBase58()}`);
    console.log(`Exchange Request: ${exchangeRequestPda.toBase58()}`);
    console.log(`Token Account: ${tokenAccount.toBase58()}`);

    console.log(`\n🔄 Exchange Request作成 + フリーズ実行中...`);

    const tx = await program.methods
      .createExchangeRequestWithFreeze(
        nftOwner,
        requestId,
        nftMint,
        new anchor.BN(shippingFeeLamports),
        depositTokenType,
        depositTokenMint
      )
      .accounts({
        exchangeRequest: exchangeRequestPda,
        rwaState: rwaStatePda,
        globalConfig: globalConfigPda,
        admin: adminKeypair.publicKey,
        owner: nftOwner,
        tokenAccount: tokenAccount,
        mint: nftMint,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([adminKeypair])
      .rpc();

    console.log(`\n✅ Exchange Request作成 + フリーズ完了!`);
    console.log(
      `Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );

    // 作成されたExchange Request確認
    const exchangeRequest = await program.account.exchangeRequest.fetch(
      exchangeRequestPda
    );
    const rwaState = await program.account.rwaState.fetch(rwaStatePda);

    console.log(`\n📋 作成されたExchange Request:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Request ID: ${exchangeRequest.requestId}`);
    console.log(`Owner: ${exchangeRequest.owner.toBase58()}`);
    console.log(`NFT Mint: ${exchangeRequest.nftMint.toBase58()}`);
    console.log(
      `Shipping Fee: ${Number(exchangeRequest.shippingFee)} lamports`
    );
    console.log(`Status: ${JSON.stringify(exchangeRequest.status)}`);
    console.log(
      `Deposit Amount: ${Number(exchangeRequest.depositAmount)} lamports`
    );
    console.log(
      `Token Type: ${JSON.stringify(exchangeRequest.depositTokenType)}`
    );
    console.log(
      `Timestamp: ${new Date(
        Number(exchangeRequest.timestamp) * 1000
      ).toISOString()}`
    );
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    console.log(`\n📋 RWA State:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Owner: ${rwaState.owner.toBase58()}`);
    console.log(
      `Locked At: ${
        rwaState.lockedAt
          ? new Date(Number(rwaState.lockedAt) * 1000).toISOString()
          : "None"
      }`
    );
    console.log(`Lock Reason: ${rwaState.lockReason || "None"}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    console.log(`\n🎯 ワークフロー状況:`);
    console.log(`✅ STEP 1: Exchange Request作成完了`);
    console.log(`✅ STEP 2: NFT物理フリーズ完了`);
    console.log(`⏳ STEP 3: ユーザーの送料デポジット待ち`);
    console.log(`⏳ STEP 4: 発送 & 完了`);

    console.log(`\n📢 次のステップ (ユーザー実行):`);
    console.log(
      `npx tsx scripts/04_exchange/02_deposit_shipping_fee.ts ${requestId} ${nftOwner.toBase58()}`
    );
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n🎉 Exchange Request作成 + フリーズ完了");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 失敗:", error);
      process.exit(1);
    });
}

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
 * 💰 送料デポジット スクリプト (ユーザー実行)
 *
 * 使用方法:
 * npx tsx scripts/04_exchange/02_deposit_shipping_fee.ts <request_id> <nft_owner>
 *
 * 例:
 * npx tsx scripts/04_exchange/02_deposit_shipping_fee.ts "exchange-001" kLVTJRLJPif8QexEZZiobhyLXA9Gqvhziv7DXdVuNgE
 */

async function main() {
  // コマンドライン引数
  const requestId = process.argv[2];
  const nftOwnerStr = process.argv[3];

  if (!requestId || !nftOwnerStr) {
    console.error(
      "❌ 使用方法: npx tsx scripts/04_exchange/02_deposit_shipping_fee.ts <request_id> <nft_owner>"
    );
    console.error(
      "例: npx tsx scripts/04_exchange/02_deposit_shipping_fee.ts exchange-001 kLVTJRLJPif8QexEZZiobhyLXA9Gqvhziv7DXdVuNgE"
    );
    process.exit(1);
  }

  const nftOwner = new PublicKey(nftOwnerStr);

  // この例では admin keypair を使いますが、実際にはユーザーのkeypairを使用します
  const userKeypair = loadKeypair("/Users/nycrt/.config/solana/id.json");

  console.log(`💰 送料デポジット実行`);
  console.log(`===================`);
  console.log(`User: ${userKeypair.publicKey.toBase58()}`);
  console.log(`NFT Owner: ${nftOwner.toBase58()}`);
  console.log(`Request ID: ${requestId}`);

  // Provider設定
  const wallet = new Wallet(userKeypair);
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

    const [exchangeRequestPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("exchange_request"),
        nftOwner.toBuffer(),
        Buffer.from(requestId),
      ],
      program.programId
    );

    console.log(`\n🏛️ PDAs:`);
    console.log(`Global Config: ${globalConfigPda.toBase58()}`);
    console.log(`Exchange Request: ${exchangeRequestPda.toBase58()}`);

    // Exchange Request情報取得
    const exchangeRequest = await program.account.exchangeRequest.fetch(
      exchangeRequestPda
    );
    console.log(`\n📋 Exchange Request情報:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Request ID: ${exchangeRequest.requestId}`);
    console.log(`NFT Mint: ${exchangeRequest.nftMint.toBase58()}`);
    console.log(
      `Required Shipping Fee: ${Number(
        exchangeRequest.shippingFee
      )} lamports (${
        Number(exchangeRequest.shippingFee) / LAMPORTS_PER_SOL
      } SOL)`
    );
    console.log(
      `Current Deposit: ${Number(exchangeRequest.depositAmount)} lamports`
    );
    console.log(`Status: ${JSON.stringify(exchangeRequest.status)}`);
    console.log(
      `Token Type: ${JSON.stringify(exchangeRequest.depositTokenType)}`
    );
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 必要な送料額を取得
    const requiredAmount = Number(exchangeRequest.shippingFee);

    // Global Config取得（デポジット先アカウント確認）
    const globalConfig = await program.account.globalConfig.fetch(
      globalConfigPda
    );

    // RWA State PDA
    const [rwaStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("rwa_state"), exchangeRequest.nftMint.toBuffer()],
      program.programId
    );

    console.log(`\n💰 送料デポジット実行中...`);
    console.log(
      `デポジット額: ${requiredAmount} lamports (${
        requiredAmount / LAMPORTS_PER_SOL
      } SOL)`
    );

    const tx = await program.methods
      .depositShippingFee(new anchor.BN(requiredAmount))
      .accounts({
        exchangeRequest: exchangeRequestPda,
        rwaState: rwaStatePda,
        globalConfig: globalConfigPda,
        owner: userKeypair.publicKey,
        mint: exchangeRequest.nftMint,
        depositAccount: globalConfig.depositTarget,
        userTokenAccount: null, // SOLの場合はnull
        depositTokenAccount: null,
        tokenProgram: null,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([userKeypair])
      .rpc();

    console.log(`\n✅ 送料デポジット完了!`);
    console.log(
      `Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );

    // 更新されたExchange Request確認
    const updatedExchangeRequest = await program.account.exchangeRequest.fetch(
      exchangeRequestPda
    );
    console.log(`\n📋 更新されたExchange Request:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Status: ${JSON.stringify(updatedExchangeRequest.status)}`);
    console.log(
      `Deposit Amount: ${Number(
        updatedExchangeRequest.depositAmount
      )} lamports (${
        Number(updatedExchangeRequest.depositAmount) / LAMPORTS_PER_SOL
      } SOL)`
    );
    console.log(
      `Required: ${Number(updatedExchangeRequest.shippingFee)} lamports`
    );
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Funded状態チェック
    console.log(`\n🔍 Funded状態チェック...`);
    const isFunded = await program.methods
      .isExchangeRequestFunded()
      .accounts({
        exchangeRequest: exchangeRequestPda,
      })
      .view();

    console.log(`💡 Funded Status: ${isFunded}`);

    if (isFunded) {
      console.log(
        `🎉 SUCCESS: Exchange Requestが正常にfunded状態になりました！`
      );
    } else {
      console.log(`⚠️ Exchange Requestがまだfunded状態ではありません`);
    }

    console.log(`\n🎯 ワークフロー状況:`);
    console.log(`✅ STEP 1: Exchange Request作成完了`);
    console.log(`✅ STEP 2: NFT物理フリーズ完了`);
    console.log(`✅ STEP 3: 送料デポジット完了`);
    console.log(`⏳ STEP 4: 管理者による発送処理`);

    console.log(`\n📢 次のステップ (管理者実行):`);
    console.log(`物理アイテムの発送と tracking情報の更新`);
    console.log(
      `必要に応じて返金: npx tsx scripts/04_exchange/03_refund_exchange.ts`
    );
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n🎉 送料デポジット完了");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 失敗:", error);
      process.exit(1);
    });
}

#!/usr/bin/env tsx
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { AkiraSolana } from "../../target/types/akira_solana";
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

const adminKeypair = loadKeypair("/Users/nycrt/.config/solana/id.json");

console.log(`💰 Exchange Request Funded Check テスト (既存Request使用)`);
console.log(`==================================================`);
console.log(`Admin: ${adminKeypair.publicKey.toBase58()}`);

// Provider設定
const wallet = new Wallet(adminKeypair);
const provider = new AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});
anchor.setProvider(provider);

const program = anchor.workspace.AkiraSolana as Program<AkiraSolana>;
console.log(`📋 Program ID: ${program.programId.toBase58()}`);

// 🎯 既存のExchange Request（以前のテストで作成済み）
const EXISTING_REQUEST_ID = "fresh-complete";
const NFT_OWNER = adminKeypair.publicKey;

async function main() {
  try {
    console.log(`\n🔍 既存Exchange Request使用`);
    console.log(`===========================`);

    const [exchangeRequestPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("exchange_request"),
        NFT_OWNER.toBuffer(),
        Buffer.from(EXISTING_REQUEST_ID),
      ],
      program.programId
    );

    console.log(`📝 Using existing Exchange Request:`);
    console.log(`  - Request ID: ${EXISTING_REQUEST_ID}`);
    console.log(`  - NFT Owner: ${NFT_OWNER.toBase58()}`);
    console.log(`  - Exchange Request PDA: ${exchangeRequestPda.toBase58()}`);

    // Exchange Request存在確認
    let exchangeRequestExists = false;
    try {
      const existingRequest = await program.account.exchangeRequest.fetch(
        exchangeRequestPda
      );
      console.log(`✅ Exchange Request found!`);
      console.log(`  - Status: ${JSON.stringify(existingRequest.status)}`);
      console.log(
        `  - Shipping Fee: ${Number(existingRequest.shippingFee)} lamports`
      );
      console.log(
        `  - Deposit Amount: ${Number(existingRequest.depositAmount)} lamports`
      );
      console.log(`  - NFT Mint: ${existingRequest.nftMint.toBase58()}`);
      console.log(
        `  - Timestamp: ${new Date(
          Number(existingRequest.timestamp) * 1000
        ).toISOString()}`
      );
      exchangeRequestExists = true;
    } catch (error) {
      console.log(`❌ Exchange Request not found:`, error);
      return;
    }

    // 💰 STEP 1: is_exchange_request_funded 機能テスト
    console.log(`\n💰 STEP 1: is_exchange_request_funded 機能テスト`);
    console.log(`===========================================`);

    if (exchangeRequestExists) {
      const currentRequest = await program.account.exchangeRequest.fetch(
        exchangeRequestPda
      );

      console.log(`📊 Current Exchange Request Details:`);
      console.log(`  - Status: ${JSON.stringify(currentRequest.status)}`);
      console.log(
        `  - Required Shipping Fee: ${Number(
          currentRequest.shippingFee
        )} lamports (${
          Number(currentRequest.shippingFee) / LAMPORTS_PER_SOL
        } SOL)`
      );
      console.log(
        `  - Current Deposit: ${Number(
          currentRequest.depositAmount
        )} lamports (${
          Number(currentRequest.depositAmount) / LAMPORTS_PER_SOL
        } SOL)`
      );

      // 📋 Test Case: Funded check実行
      console.log(`\n📋 Funded Check Test:`);
      try {
        console.log(`🔍 Calling is_exchange_request_funded...`);

        const isFunded = await program.methods
          .isExchangeRequestFunded()
          .accounts({
            exchangeRequest: exchangeRequestPda,
          })
          .view();

        console.log(`\n🎯 FUNDED CHECK RESULT: ${isFunded}`);

        if (isFunded) {
          console.log(`✅ SUCCESS: Exchange request is FUNDED!`);
          console.log(
            `💰 Deposit (${Number(
              currentRequest.depositAmount
            )} lamports) >= Required (${Number(
              currentRequest.shippingFee
            )} lamports)`
          );
        } else {
          console.log(`❌ Exchange request is NOT funded`);
          console.log(
            `💸 Deposit (${Number(
              currentRequest.depositAmount
            )} lamports) < Required (${Number(
              currentRequest.shippingFee
            )} lamports)`
          );
        }

        // 📊 詳細比較
        console.log(`\n📊 Detailed Comparison:`);
        const shippingFee = Number(currentRequest.shippingFee);
        const depositAmount = Number(currentRequest.depositAmount);
        const difference = depositAmount - shippingFee;

        console.log(`  Required : ${shippingFee.toLocaleString()} lamports`);
        console.log(`  Deposited: ${depositAmount.toLocaleString()} lamports`);
        console.log(`  Difference: ${difference.toLocaleString()} lamports`);
        console.log(
          `  Percentage: ${((depositAmount / shippingFee) * 100).toFixed(2)}%`
        );

        if (difference >= 0) {
          console.log(
            `  Result: ✅ SUFFICIENT (${difference.toLocaleString()} lamports extra)`
          );
        } else {
          console.log(
            `  Result: ❌ INSUFFICIENT (${Math.abs(
              difference
            ).toLocaleString()} lamports short)`
          );
        }

        // ステータス確認
        console.log(`\n📋 Status Analysis:`);
        const status = currentRequest.status;
        console.log(`  Current Status: ${JSON.stringify(status)}`);

        if (JSON.stringify(status).includes("Funded")) {
          console.log(`  Status Check: ✅ Already marked as Funded`);
        } else {
          console.log(`  Status Check: ⏳ Not yet marked as Funded`);
        }

        // 🧮 Logic Verification
        console.log(`\n🧮 Logic Verification:`);
        console.log(
          `  Function should return: ${
            depositAmount >= shippingFee ||
            JSON.stringify(status).includes("Funded")
          }`
        );
        console.log(`  Actual function result: ${isFunded}`);

        if (
          (depositAmount >= shippingFee ||
            JSON.stringify(status).includes("Funded")) === isFunded
        ) {
          console.log(
            `  Logic Check: ✅ CORRECT - Function logic working as expected`
          );
        } else {
          console.log(
            `  Logic Check: ❌ MISMATCH - Function logic may have issues`
          );
        }
      } catch (error) {
        console.error(`❌ Failed to check funded status:`, error);
        console.log(
          `Error details:`,
          error.errorLogs || "No error logs available"
        );
      }
    } else {
      console.log(`⚠️ No valid exchange request available for testing`);
    }

    // 🏆 結果サマリー
    console.log(`\n🏆 Exchange Funded Check テスト結果`);
    console.log(`=================================`);
    console.log(`✅ is_exchange_request_funded 関数テスト完了`);
    console.log(`🔍 既存のExchange Requestでテスト実行`);
    console.log(`📊 デポジット額と送料の比較ロジック確認`);
    console.log(`🎯 Purchase系と同様のfunded check機能提供`);
    console.log(`\n💡 この機能により以下が可能:`);
    console.log(`  - Exchange Requestの支払い状況を即座に確認`);
    console.log(`  - 条件満たした場合の次のステップへの進行判定`);
    console.log(`  - フロントエンドでのUX改善（状態表示）`);
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n🎉 Exchange Funded Check テスト完了");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Exchange Funded Check テスト失敗:", error);
      process.exit(1);
    });
}

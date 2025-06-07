import * as dotenv from "dotenv";
dotenv.config();

import {
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  factoryPda,
  factoryProgramMethods,
  factoryConnection,
} from "../common/program-methods";
import { scriptProperties } from "../consts/scriptProperties";
import fs from "fs";

/**
 * 🔐 マルチシグリファンド処理スクリプト
 *
 * 使用方法:
 * pnpm tsx scripts/multisig/02_multisig_refund.ts <request_id> <user_pubkey>
 */

async function main() {
  const { program, wallet, keypair } = factoryProgramMethods();
  const connection = factoryConnection();

  // コマンドライン引数取得
  const requestId = process.argv[2];
  const userPubkeyStr = process.argv[3];

  if (!requestId || !userPubkeyStr) {
    console.error(
      "❌ 使用方法: pnpm tsx scripts/multisig/02_multisig_refund.ts <request_id> <user_pubkey>"
    );
    return;
  }

  const userPubkey = new PublicKey(userPubkeyStr);

  console.log("🔐 マルチシグリファンド処理開始...");
  console.log(`Request ID: ${requestId}`);
  console.log(`User: ${userPubkey.toString()}`);

  // 1. マルチシグ情報読み込み
  const multisigInfoPath = "/tmp/multisig_keys/multisig_info.json";
  if (!fs.existsSync(multisigInfoPath)) {
    console.error(
      "❌ マルチシグ情報が見つかりません。先にマルチシグを作成してください。"
    );
    return;
  }

  const multisigInfo = JSON.parse(fs.readFileSync(multisigInfoPath, "utf-8"));
  const multisigPda = new PublicKey(multisigInfo.multisigAddress);

  console.log(`\n📋 マルチシグ情報:`);
  console.log(`Address: ${multisigPda.toString()}`);
  console.log(
    `Required Signatures: ${multisigInfo.requiredSignatures} of ${multisigInfo.totalSigners}`
  );

  // 2. 管理者Keypairs読み込み
  const loadKeypair = (filename: string): Keypair => {
    const keyArray = JSON.parse(
      fs.readFileSync(`/tmp/multisig_keys/${filename}`, "utf-8")
    );
    return Keypair.fromSecretKey(new Uint8Array(keyArray));
  };

  const admin1 = loadKeypair("admin1.json");
  const admin2 = loadKeypair("admin2.json");
  const admin3 = loadKeypair("admin3.json");

  console.log(`\n👥 マルチシグ管理者:`);
  console.log(`Admin 1: ${admin1.publicKey.toString()}`);
  console.log(`Admin 2: ${admin2.publicKey.toString()}`);
  console.log(`Admin 3: ${admin3.publicKey.toString()}`);

  // 3. PDA計算
  const globalConfigPda = factoryPda(
    [Buffer.from("config")],
    program.programId
  );

  const purchaseRequestPda = factoryPda(
    [
      Buffer.from("purchase_request"),
      userPubkey.toBuffer(),
      Buffer.from(requestId),
    ],
    program.programId
  );

  console.log(`\n🏛️ PDAs:`);
  console.log(`Global Config: ${globalConfigPda.toString()}`);
  console.log(`Purchase Request: ${purchaseRequestPda.toString()}`);

  // 4. Purchase Request状態確認
  try {
    // @ts-ignore
    const purchaseRequest = await program.account.purchaseRequest.fetch(
      purchaseRequestPda
    );

    console.log(`\n📊 Purchase Request状態:`);
    console.log(`Owner: ${purchaseRequest.owner.toString()}`);
    console.log(`Status: ${JSON.stringify(purchaseRequest.status)}`);
    console.log(`Deposit Amount: ${purchaseRequest.depositAmount} lamports`);
    console.log(
      `Token Type: ${JSON.stringify(purchaseRequest.depositTokenType)}`
    );

    // 5. マルチシグリファンド実行（2-of-3署名）
    console.log(`\n🔐 マルチシグリファンド実行...`);

    // Note: 現在の実装では実際のマルチシグプログラムは未実装のため、
    // 代表管理者による直接リファンドを実行
    // 実際のマルチシグ実装では、複数署名を集める必要があります

    console.log(`⚠️ [PROTOTYPE] 代表管理者による直接リファンド実行...`);
    console.log(`実際の運用では3人中2人の署名が必要です`);

    // *** TEMPORARY: 単一管理者による代替実行 ***
    // 実際はマルチシグの署名収集プロセスが必要
    const refundKeypair = Keypair.fromSecretKey(
      new Uint8Array(
        JSON.parse(fs.readFileSync("/tmp/deposit_target.json", "utf-8"))
      )
    );

    const refundTx = await program.methods
      .refundPurchaseRequest("Multisig approved refund - prototype execution")
      .accounts({
        purchaseRequest: purchaseRequestPda,
        globalConfig: globalConfigPda,
        admin: wallet.publicKey,
        owner: userPubkey,
        depositAccount: refundKeypair.publicKey, // 実際はマルチシグアドレス
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair, refundKeypair])
      .rpc();

    console.log(`\n✅ リファンド実行成功！`);
    console.log(
      `Transaction: https://explorer.solana.com/tx/${refundTx}?cluster=${scriptProperties.solanaNetwork}`
    );

    // 6. 結果確認
    // @ts-ignore
    const updatedRequest = await program.account.purchaseRequest.fetch(
      purchaseRequestPda
    );
    console.log(`\n📊 更新後状態:`);
    console.log(`Status: ${JSON.stringify(updatedRequest.status)}`);
    console.log(
      `Cancellation Reason: ${updatedRequest.cancellationReason || "N/A"}`
    );
  } catch (error) {
    console.error("❌ エラー:", error);
  }
}

/**
 * 🔮 将来のマルチシグ実装（参考）
 */
async function futureMultisigRefund() {
  console.log(`
🔮 【将来実装】真のマルチシグリファンド手順:

1️⃣ **提案作成**
   - Admin1がリファンド提案作成
   - 理由とパラメータ指定

2️⃣ **署名収集**  
   - Admin2が提案確認・署名
   - Admin3が提案確認・署名
   - 2-of-3の閾値達成

3️⃣ **実行**
   - 署名が揃った時点で自動実行
   - オンチェーン検証

4️⃣ **監査**
   - 全署名の記録保持
   - 透明性確保
  `);
}

// 実行
main()
  .then(() => {
    futureMultisigRefund();
  })
  .catch(console.error);

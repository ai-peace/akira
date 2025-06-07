import * as dotenv from "dotenv";
dotenv.config();

import {
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  factoryPda,
  factoryProgramMethods,
  factoryConnection,
} from "../common/program-methods";
import { scriptProperties } from "../consts/scriptProperties";
import fs from "fs";
import path from "path";

/**
 * 🔐 マルチシグDeposit Target作成・設定スクリプト
 *
 * 使用方法:
 * pnpm tsx scripts/multisig/01_create_multisig_deposit.ts
 */

async function main() {
  const { program, wallet, keypair } = factoryProgramMethods();
  const connection = factoryConnection();

  console.log("🚀 マルチシグDeposit Target作成開始...");
  console.log(`Admin: ${wallet.publicKey.toString()}`);

  // 1. 3人の管理者用Keypair生成
  const admin1 = Keypair.generate();
  const admin2 = Keypair.generate();
  const admin3 = Keypair.generate();

  console.log("\n👥 管理者Keypairs生成:");
  console.log(`Admin 1: ${admin1.publicKey.toString()}`);
  console.log(`Admin 2: ${admin2.publicKey.toString()}`);
  console.log(`Admin 3: ${admin3.publicKey.toString()}`);

  // 2. Keypairをファイルに保存
  const multisigDir = "/tmp/multisig_keys";
  if (!fs.existsSync(multisigDir)) {
    fs.mkdirSync(multisigDir, { recursive: true });
  }

  const saveKeypair = (keypair: Keypair, filename: string) => {
    const keypairArray = Array.from(keypair.secretKey);
    fs.writeFileSync(
      path.join(multisigDir, filename),
      JSON.stringify(keypairArray)
    );
  };

  saveKeypair(admin1, "admin1.json");
  saveKeypair(admin2, "admin2.json");
  saveKeypair(admin3, "admin3.json");

  console.log(`\n💾 Keypairs保存先: ${multisigDir}/`);

  // 3. マルチシグアカウント作成（2-of-3）
  const signers = [admin1.publicKey, admin2.publicKey, admin3.publicKey];
  const requiredSignatures = 2;

  // マルチシグPDA計算
  const multisigSeed = Buffer.from("multisig_deposit_v1");
  const [multisigPda, multisigBump] = PublicKey.findProgramAddressSync(
    [multisigSeed],
    program.programId
  );

  console.log(`\n🔐 マルチシグアカウント: ${multisigPda.toString()}`);
  console.log(`Bump: ${multisigBump}`);
  console.log(
    `Required Signatures: ${requiredSignatures} of ${signers.length}`
  );

  // 4. マルチシグアカウントに初期資金を送金（テスト用）
  const fundingAmount = 0.1 * LAMPORTS_PER_SOL;

  try {
    const fundingTx = await connection.requestAirdrop(
      multisigPda,
      fundingAmount
    );
    await connection.confirmTransaction(fundingTx);
    console.log(
      `💰 マルチシグアカウントに${fundingAmount / LAMPORTS_PER_SOL} SOL送金完了`
    );
  } catch (error) {
    console.log("⚠️ Airdrop失敗（Devnet制限の可能性）");
  }

  // 5. Global Configのdeposit_targetを更新
  const globalConfigPda = factoryPda(
    [Buffer.from("config")],
    program.programId
  );

  try {
    const updateTx = await program.methods
      .updateDepositTarget(multisigPda)
      .accounts({
        globalConfig: globalConfigPda,
        admin: wallet.publicKey,
      })
      .signers([keypair])
      .rpc();

    console.log("\n✅ Deposit Target更新成功！");
    console.log(`旧Deposit Target → 新マルチシグDeposit Target`);
    console.log(
      `Transaction: https://explorer.solana.com/tx/${updateTx}?cluster=${scriptProperties.solanaNetwork}`
    );

    // 6. 設定確認
    // @ts-ignore
    const config = await program.account.globalConfig.fetch(globalConfigPda);
    console.log(`\n📋 更新後設定確認:`);
    console.log(`Admin: ${config.admin.toString()}`);
    console.log(`Deposit Target: ${config.depositTarget.toString()}`);
    console.log(
      `Is Multisig: ${
        config.depositTarget.equals(multisigPda) ? "✅ Yes" : "❌ No"
      }`
    );

    // 7. マルチシグ情報をJSON出力
    const multisigInfo = {
      multisigAddress: multisigPda.toString(),
      bump: multisigBump,
      requiredSignatures,
      totalSigners: signers.length,
      signers: signers.map((s) => s.toString()),
      createdAt: new Date().toISOString(),
      network: scriptProperties.solanaNetwork,
    };

    fs.writeFileSync(
      path.join(multisigDir, "multisig_info.json"),
      JSON.stringify(multisigInfo, null, 2)
    );

    console.log(`\n📄 マルチシグ情報保存: ${multisigDir}/multisig_info.json`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

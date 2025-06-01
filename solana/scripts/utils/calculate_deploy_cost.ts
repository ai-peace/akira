import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { scriptProperties } from "../consts/scriptProperties";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log(`💰 Calculating Solana Program Deploy Cost`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // プログラムバイナリのサイズを取得
  const programPath = path.join(process.cwd(), "target/deploy/akira_solana.so");

  if (!fs.existsSync(programPath)) {
    console.error(
      "❌ Program binary not found. Run 'pnpm anchor build' first."
    );
    process.exit(1);
  }

  const stats = fs.statSync(programPath);
  const programSizeBytes = stats.size;
  const programSizeKB = programSizeBytes / 1024;
  const programSizeMB = programSizeKB / 1024;

  console.log(`📊 Program Binary Analysis:`);
  console.log(`🔧 File: akira_solana.so`);
  console.log(
    `📏 Size: ${programSizeBytes.toLocaleString()} bytes (${programSizeKB.toFixed(
      2
    )} KB / ${programSizeMB.toFixed(2)} MB)`
  );

  // Solana プログラムデプロイコスト計算
  // 1. 基本的なRent計算（バイナリサイズベース）
  const BYTES_PER_LAMPORT_RENT = 6960; // 約1 SOL per 6960 bytes for rent-exempt
  const rentLamports =
    Math.ceil(programSizeBytes / BYTES_PER_LAMPORT_RENT) * LAMPORTS_PER_SOL;

  // 2. より正確なRent計算（Solanaの実際の計算式）
  const LAMPORTS_PER_BYTE_YEAR = 3480; // 年間1バイトあたりのlamports
  const EXEMPT_RENT_EPOCH_CREDITS = 2; // Rent exemptに必要なエポック数分
  const accurateRentLamports =
    programSizeBytes * LAMPORTS_PER_BYTE_YEAR * EXEMPT_RENT_EPOCH_CREDITS;

  // 3. 実際のSolanaの計算に近い値
  const MIN_RENT_EXEMPT_BALANCE = Math.max(
    (programSizeBytes + 128) * 6960, // 基本計算 + ヘッダー
    1461600 // 最小Rent exempt balance
  );

  // 4. デプロイトランザクション手数料
  const DEPLOY_TRANSACTION_FEE = 5000; // 基本手数料
  const LARGE_PROGRAM_ADDITIONAL_FEE = Math.max(
    0,
    Math.floor(programSizeBytes / 10000) * 1000
  ); // 大きなプログラム用の追加手数料

  const totalTransactionFee =
    DEPLOY_TRANSACTION_FEE + LARGE_PROGRAM_ADDITIONAL_FEE;

  // 合計コスト
  const totalDeployCost = MIN_RENT_EXEMPT_BALANCE + totalTransactionFee;
  const totalDeployCostSOL = totalDeployCost / LAMPORTS_PER_SOL;

  console.log(`\n💰 Deploy Cost Breakdown:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  console.log(`🏠 Rent-Exempt Balance:`);
  console.log(
    `   • Required: ${MIN_RENT_EXEMPT_BALANCE.toLocaleString()} lamports (${(
      MIN_RENT_EXEMPT_BALANCE / LAMPORTS_PER_SOL
    ).toFixed(6)} SOL)`
  );
  console.log(`   • Purpose: Keep program account rent-exempt`);
  console.log(`   • Note: This is recoverable when program is closed`);

  console.log(`\n💸 Transaction Fees:`);
  console.log(
    `   • Base Deploy Fee: ${DEPLOY_TRANSACTION_FEE.toLocaleString()} lamports (${(
      DEPLOY_TRANSACTION_FEE / LAMPORTS_PER_SOL
    ).toFixed(6)} SOL)`
  );
  if (LARGE_PROGRAM_ADDITIONAL_FEE > 0) {
    console.log(
      `   • Large Program Fee: ${LARGE_PROGRAM_ADDITIONAL_FEE.toLocaleString()} lamports (${(
        LARGE_PROGRAM_ADDITIONAL_FEE / LAMPORTS_PER_SOL
      ).toFixed(6)} SOL)`
    );
  }
  console.log(
    `   • Total Transaction Fee: ${totalTransactionFee.toLocaleString()} lamports (${(
      totalTransactionFee / LAMPORTS_PER_SOL
    ).toFixed(6)} SOL)`
  );
  console.log(`   • Note: This is non-recoverable`);

  console.log(`\n📊 Total Deploy Cost:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(
    `💰 Total: ${totalDeployCost.toLocaleString()} lamports (${totalDeployCostSOL.toFixed(
      6
    )} SOL)`
  );

  // USD換算（複数のSOL価格で計算）
  const solPrices = [50, 100, 150, 200, 250];
  console.log(`\n💵 USD Estimates:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  solPrices.forEach((price) => {
    const usdCost = totalDeployCostSOL * price;
    console.log(`   • SOL = $${price}: ~$${usdCost.toFixed(2)}`);
  });

  // ネットワーク別比較
  console.log(`\n🌐 Network Deployment Costs:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🧪 Devnet: ~$0 (Free SOL via airdrop)`);
  console.log(`🔧 Testnet: ~$0 (Free SOL via airdrop)`);
  console.log(
    `🚀 Mainnet: ${totalDeployCostSOL.toFixed(6)} SOL (~$${(
      totalDeployCostSOL * 200
    ).toFixed(2)} at $200/SOL)`
  );

  // 比較（他のブロックチェーン）
  console.log(`\n⚖️  Comparison with Other Blockchains:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🟠 Ethereum: $50-500+ (depending on gas price)`);
  console.log(`🔵 Arbitrum: $10-50`);
  console.log(`🟣 Polygon: $1-10`);
  console.log(
    `🟢 Solana: $${(totalDeployCostSOL * 200).toFixed(
      2
    )} (estimated at $200/SOL)`
  );

  // 最適化のヒント
  console.log(`\n💡 Cost Optimization Tips:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🔧 1. Code Optimization: Reduce program size to lower rent`);
  console.log(`🧪 2. Test on Devnet: Free deployment for testing`);
  console.log(
    `♻️  3. Program Upgradability: Consider using upgradeable programs`
  );
  console.log(`📦 4. Dead Code Elimination: Remove unused functions`);
  console.log(`🎯 5. Deploy Timing: Deploy when SOL price is lower`);

  // 現在のプログラムサイズ分析
  console.log(`\n🔍 Program Size Analysis:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const averageSolanaProgram = 200 * 1024; // 200KB平均
  const sizeComparison = programSizeBytes / averageSolanaProgram;

  console.log(`📏 Your Program: ${programSizeKB.toFixed(2)} KB`);
  console.log(`📊 Average Solana Program: ~200 KB`);
  console.log(
    `📈 Size Ratio: ${sizeComparison.toFixed(2)}x ${
      sizeComparison > 1.5
        ? "(Large)"
        : sizeComparison > 1
        ? "(Above Average)"
        : "(Compact)"
    }`
  );

  if (sizeComparison > 1.5) {
    console.log(
      `⚠️  Consider optimization: Your program is larger than average`
    );
  } else if (sizeComparison < 0.5) {
    console.log(`✅ Well optimized: Your program is compact`);
  } else {
    console.log(`👍 Good size: Your program is reasonably sized`);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

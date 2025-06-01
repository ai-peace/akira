import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { scriptProperties } from "../consts/scriptProperties";

async function main() {
  const txSignature = process.argv[2];

  if (!txSignature) {
    console.error("❌ Transaction signature is required");
    console.log(
      "Usage: pnpm tsx scripts/utils/check_transaction_cost.ts <tx_signature>"
    );
    console.log(
      "Example: pnpm tsx scripts/utils/check_transaction_cost.ts 5hbCd9vXAyzv..."
    );
    process.exit(1);
  }

  const connection = new Connection(
    scriptProperties.solanaNetwork === "devnet"
      ? "https://api.devnet.solana.com"
      : "https://api.mainnet-beta.solana.com"
  );

  try {
    console.log(`🔍 Analyzing transaction cost...`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 Transaction: ${txSignature}`);
    console.log(`🌐 Network: ${scriptProperties.solanaNetwork}`);

    const txDetails = await connection.getTransaction(txSignature, {
      commitment: "finalized",
      maxSupportedTransactionVersion: 0,
    });

    if (!txDetails) {
      console.error("❌ Transaction not found");
      process.exit(1);
    }

    const meta = txDetails.meta;
    if (!meta) {
      console.error("❌ Transaction metadata not available");
      process.exit(1);
    }

    // 基本情報
    console.log(`\n💰 Transaction Cost Breakdown:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 手数料
    const fee = meta.fee;
    const feeSOL = fee / LAMPORTS_PER_SOL;
    console.log(
      `💸 Transaction Fee: ${fee.toLocaleString()} lamports (${feeSOL.toFixed(
        6
      )} SOL)`
    );

    // Compute Units
    const computeUnitsConsumed = meta.computeUnitsConsumed || 0;
    console.log(
      `⚡ Compute Units Consumed: ${computeUnitsConsumed.toLocaleString()}`
    );

    // アカウント変更を分析
    const preBalances = meta.preBalances;
    const postBalances = meta.postBalances;
    const accountKeys = txDetails.transaction.message.staticAccountKeys || [];

    console.log(`\n🏦 Account Balance Changes:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    let totalCost = 0;
    for (let i = 0; i < preBalances.length; i++) {
      const balanceChange = postBalances[i] - preBalances[i];
      if (balanceChange !== 0) {
        const balanceChangeSOL = balanceChange / LAMPORTS_PER_SOL;
        const accountKey = accountKeys[i]?.toString() || "Unknown";

        if (balanceChange < 0) {
          totalCost += Math.abs(balanceChange);
          console.log(
            `💸 ${accountKey.slice(
              0,
              20
            )}...: ${balanceChange.toLocaleString()} lamports (${balanceChangeSOL.toFixed(
              6
            )} SOL)`
          );
        } else {
          console.log(
            `💰 ${accountKey.slice(
              0,
              20
            )}...: +${balanceChange.toLocaleString()} lamports (+${balanceChangeSOL.toFixed(
              6
            )} SOL)`
          );
        }
      }
    }

    // 合計コスト
    const totalCostSOL = totalCost / LAMPORTS_PER_SOL;
    console.log(`\n📊 Summary:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(
      `💸 Total Cost: ${totalCost.toLocaleString()} lamports (${totalCostSOL.toFixed(
        6
      )} SOL)`
    );

    // USD換算（概算）
    const solPriceUSD = 20; // 概算価格（実際は変動）
    const totalCostUSD = totalCostSOL * solPriceUSD;
    console.log(
      `💵 Estimated USD Cost: ~$${totalCostUSD.toFixed(
        4
      )} (assuming SOL = $${solPriceUSD})`
    );

    // 内訳分析
    console.log(`\n🔍 Cost Breakdown Analysis:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // NFT Mint作成コスト
    const nftMintRent = 1461600; // NFT Mint account rent
    console.log(
      `🎨 NFT Mint Creation: ~${nftMintRent.toLocaleString()} lamports (${(
        nftMintRent / LAMPORTS_PER_SOL
      ).toFixed(6)} SOL)`
    );

    // RWA State作成コスト
    const rwaStateRent = 1500000; // 概算
    console.log(
      `🔒 RWA State Creation: ~${rwaStateRent.toLocaleString()} lamports (${(
        rwaStateRent / LAMPORTS_PER_SOL
      ).toFixed(6)} SOL)`
    );

    // Metadata作成コスト
    const metadataRent = 5616720; // 概算
    console.log(
      `📄 Metadata Creation: ~${metadataRent.toLocaleString()} lamports (${(
        metadataRent / LAMPORTS_PER_SOL
      ).toFixed(6)} SOL)`
    );

    // Master Edition作成コスト
    const masterEditionRent = 1030080; // 概算
    console.log(
      `👑 Master Edition Creation: ~${masterEditionRent.toLocaleString()} lamports (${(
        masterEditionRent / LAMPORTS_PER_SOL
      ).toFixed(6)} SOL)`
    );

    // Token Account作成コスト
    const tokenAccountRent = 2039280; // 概算
    console.log(
      `🏪 Token Account Creation: ~${tokenAccountRent.toLocaleString()} lamports (${(
        tokenAccountRent / LAMPORTS_PER_SOL
      ).toFixed(6)} SOL)`
    );

    console.log(`\n💡 Notes:`);
    console.log(`• Most costs are one-time account creation costs (Rent)`);
    console.log(`• Rent is recoverable when accounts are closed`);
    console.log(`• Transaction fees are non-recoverable`);
    console.log(
      `• Costs may vary based on network conditions and account sizes`
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

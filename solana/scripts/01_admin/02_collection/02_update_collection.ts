import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import {
  factoryAdminWallet,
  factoryAdminWalletKeypair,
  factoryProgramMethods,
} from "../../common/program-methods";
import { scriptConsts } from "../../consts/scriptConsts";
import { scriptProperties } from "../../consts/scriptProperties";

dotenv.config();

const loadCollectionConfig = () => {
  const configPath = path.join(__dirname, "../seed/collections.json");
  const configData = fs.readFileSync(configPath, "utf8");
  return JSON.parse(configData);
};

const loadSeed = (collectionKey: string) => {
  const collections = loadCollectionConfig();
  const config = collections[collectionKey];

  if (!config) {
    console.error(
      `❌ Collection "${collectionKey}" not found in seed/collections.json`
    );
    console.log("Available collections:", Object.keys(collections).join(", "));
    process.exit(1);
  }

  console.log(`🔄 Loading collection: ${collectionKey}`);
  console.log("Current configuration:", {
    name: config.name,
    symbol: config.symbol,
    uri: config.uri,
    sellerFeeBasisPoints: config.sellerFeeBasisPoints,
    seed: config.seed,
  });

  return {
    collectionName: config.name,
    collectionSymbol: config.symbol,
    collectionUri: config.uri,
    collectionSellerFeeBasisPoints: config.sellerFeeBasisPoints,
    collectionSeed: config.seed,
  };
};

// 更新用の設定を解析
const parseUpdateConfig = () => {
  const args = process.argv.slice(2);
  const updates: {
    newName?: string;
    newSymbol?: string;
    newUri?: string;
    newSellerFeeBasisPoints?: number;
  } = {};

  // コマンドライン引数をパース
  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case "--name":
        updates.newName = value;
        break;
      case "--symbol":
        updates.newSymbol = value;
        break;
      case "--uri":
        updates.newUri = value;
        break;
      case "--fee":
        updates.newSellerFeeBasisPoints = parseInt(value);
        break;
      default:
        console.warn(`⚠️ Unknown flag: ${flag}`);
    }
  }

  return updates;
};

async function main() {
  // コレクションキーを引数から取得（必須）
  const collectionKey = process.argv[2];

  if (!collectionKey) {
    console.error("❌ Collection key is required");
    console.log(
      "Usage: pnpm s:a:update-collection <collection-key> [--name <name>] [--symbol <symbol>] [--uri <uri>] [--fee <fee>]"
    );
    console.log(
      'Example: pnpm s:a:update-collection akira --name "New Name" --fee 500'
    );
    process.exit(1);
  }

  const config = loadSeed(collectionKey);
  const updates = parseUpdateConfig();

  // 更新内容の確認
  console.log("\n🔄 Update configuration:");
  if (updates.newName)
    console.log(`• Name: "${config.collectionName}" → "${updates.newName}"`);
  if (updates.newSymbol)
    console.log(
      `• Symbol: "${config.collectionSymbol}" → "${updates.newSymbol}"`
    );
  if (updates.newUri)
    console.log(`• URI: "${config.collectionUri}" → "${updates.newUri}"`);
  if (updates.newSellerFeeBasisPoints !== undefined) {
    console.log(
      `• Seller Fee: ${config.collectionSellerFeeBasisPoints}bp (${
        config.collectionSellerFeeBasisPoints / 100
      }%) → ${updates.newSellerFeeBasisPoints}bp (${
        updates.newSellerFeeBasisPoints / 100
      }%)`
    );
  }

  // 更新がない場合は終了
  if (Object.keys(updates).length === 0) {
    console.log(
      "⚠️ No updates specified. Use --name, --symbol, --uri, or --fee flags to specify changes."
    );
    process.exit(0);
  }

  const { program, wallet, keypair: adminKeypair } = factoryProgramMethods();

  const [collectionConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_config"), Buffer.from(config.collectionSeed)],
    scriptConsts.PROGRAM_ID
  );

  try {
    const tx = await program.methods
      .updateCollection(
        config.collectionSeed,
        updates.newName || null,
        updates.newSymbol || null,
        updates.newUri || null,
        updates.newSellerFeeBasisPoints || null
      )
      .accounts({
        collectionConfig: collectionConfigPda,
        authority: wallet.publicKey,
      })
      .signers([adminKeypair])
      .rpc();

    console.log(`\n✅ Collection "${collectionKey}" updated successfully!`);
    console.log(
      `📝 Transaction: https://explorer.solana.com/tx/${tx}?cluster=${scriptProperties.solanaNetwork}`
    );
    console.log(`🔗 Collection Config PDA: ${collectionConfigPda.toString()}`);

    console.log("\n🔍 Solana Explorer Links:");
    console.log(
      `• Transaction: https://explorer.solana.com/tx/${tx}?cluster=${scriptProperties.solanaNetwork}`
    );
    console.log(
      `• Collection Config: https://explorer.solana.com/address/${collectionConfigPda.toString()}?cluster=${
        scriptProperties.solanaNetwork
      }`
    );

    // 更新後の推奨アクション
    console.log("\n💡 Next steps:");
    console.log(
      "• Update the JSON config file if you want to persist these changes"
    );
    console.log("• Verify the changes in Solana Explorer");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

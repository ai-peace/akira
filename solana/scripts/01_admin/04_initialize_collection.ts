import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import {
  factoryAdminWallet,
  factoryAdminWalletKeypair,
  factoryProgramMethods,
} from "../common/program-methods";
import { scriptConsts } from "../consts/scriptConsts";
import { scriptProperties } from "../consts/scriptProperties";

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

  console.log(`🚀 Initializing collection: ${collectionKey}`);
  console.log("Configuration:", {
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

async function main() {
  // コレクションキーを引数から取得（デフォルト: "akira"）
  const collectionKey = process.argv[2];
  const config = loadSeed(collectionKey);

  const { program, wallet, keypair: adminKeypair } = factoryProgramMethods();

  const [collectionConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_config"), Buffer.from(config.collectionSeed)],
    scriptConsts.PROGRAM_ID
  );

  // 初期化でどうしても必要なのでキーペアを一時的に作る
  // 公開鍵は利用するが秘密鍵は破棄している
  // authorityはrust側で署名者自身になっているので問題はない
  const collectionMintKeypair = Keypair.generate();
  const collectionTokenAccount = getAssociatedTokenAddressSync(
    collectionMintKeypair.publicKey,
    adminKeypair.publicKey
  );
  const collectionMasterEditionPda =
    anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBytes(),
        collectionMintKeypair.publicKey.toBytes(),
        Buffer.from("edition"),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    )[0];

  // Metadata PDAも計算
  const [collectionMetadataPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBytes(),
      collectionMintKeypair.publicKey.toBytes(),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
  );

  try {
    const tx = await program.methods
      .initializeCollection(
        config.collectionName,
        config.collectionSymbol,
        config.collectionUri,
        config.collectionSellerFeeBasisPoints,
        config.collectionSeed
      )
      .accounts({
        collectionConfig: collectionConfigPda,
        collectionMint: collectionMintKeypair.publicKey,
        collectionTokenAccount: collectionTokenAccount,
        collectionMasterEdition: collectionMasterEditionPda,
        payer: wallet.publicKey,
        tokenMetadataProgram: new PublicKey(
          "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        ),
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([adminKeypair, collectionMintKeypair])
      .rpc();

    console.log(`✅ Collection "${collectionKey}" initialized successfully!`);
    console.log(
      `📝 Transaction: https://explorer.solana.com/tx/${tx}?cluster=${scriptProperties.solanaNetwork}`
    );
    console.log(`🔗 Collection Config PDA: ${collectionConfigPda.toString()}`);
    console.log(
      `🎨 Collection Mint: ${collectionMintKeypair.publicKey.toString()}`
    );
    console.log(`🏪 Token Account: ${collectionTokenAccount.toString()}`);
    console.log(`📄 Metadata PDA: ${collectionMetadataPda.toString()}`);
    console.log(
      `👑 Master Edition PDA: ${collectionMasterEditionPda.toString()}`
    );

    console.log("\n🔍 Solana Explorer Links:");
    console.log(
      `• Transaction: https://explorer.solana.com/tx/${tx}?cluster=${scriptProperties.solanaNetwork}`
    );
    console.log(
      `• Collection Mint: https://explorer.solana.com/address/${collectionMintKeypair.publicKey.toString()}?cluster=${
        scriptProperties.solanaNetwork
      }`
    );
    console.log(
      `• Token Account: https://explorer.solana.com/address/${collectionTokenAccount.toString()}?cluster=${
        scriptProperties.solanaNetwork
      }`
    );
    console.log(
      `• Metadata: https://explorer.solana.com/address/${collectionMetadataPda.toString()}?cluster=${
        scriptProperties.solanaNetwork
      }`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

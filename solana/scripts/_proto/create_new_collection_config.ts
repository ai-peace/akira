import * as dotenv from "dotenv";
dotenv.config();

import { PublicKey } from "@solana/web3.js";
import { factoryPda, factoryProgramMethods } from "../common/program-methods";

async function main() {
  const { program, wallet, keypair } = factoryProgramMethods();

  // 既存のCollection Configの情報を使用
  const collectionMint = new PublicKey(
    "7V5Y7gw6bFBSnXEryKQeCS2yYyL4RB42GXU1tqYmoKST"
  );
  const collectionName = "Test Collection 2";

  // 新しいCollection Config PDA（nameフィールドベース）
  const newCollectionConfigPda = factoryPda(
    [Buffer.from("collection_config"), Buffer.from(collectionName)],
    program.programId
  );

  console.log("🎨 Creating new Collection Config...");
  console.log(`Name: ${collectionName}`);
  console.log(`Collection Mint: ${collectionMint.toString()}`);
  console.log(`New PDA: ${newCollectionConfigPda.toString()}`);

  try {
    const tx = await program.methods
      .initializeCollection(
        collectionName, // name (これがPDAシードになる)
        "TEST2", // symbol
        "https://test2.example.com", // uri
        500 // seller_fee_basis_points
      )
      .accounts({
        collectionConfig: newCollectionConfigPda,
        globalConfig: factoryPda([Buffer.from("config")], program.programId),
        collectionMint: collectionMint,
        authority: wallet.publicKey,
        systemProgram: new PublicKey("11111111111111111111111111111111"),
      })
      .signers([keypair])
      .rpc();

    console.log("✅ New Collection Config created!");
    console.log(
      `Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );

    // 作成されたアカウントを確認
    // @ts-ignore
    const newCollectionConfig = await program.account.collectionConfig.fetch(
      newCollectionConfigPda
    );
    console.log("\n📋 Created Collection Config:");
    console.log(JSON.stringify(newCollectionConfig, null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

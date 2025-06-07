import * as dotenv from "dotenv";
dotenv.config();

import { PublicKey } from "@solana/web3.js";
import { factoryPda, factoryProgramMethods } from "../common/program-methods";

async function main() {
  const purchaseRequestPda = new PublicKey(
    "7uPE5BLRukWiFzdLZK2ZjkMkbu2NiVJcM3njSKhHfQuJ"
  );

  const { program } = factoryProgramMethods();

  try {
    // @ts-ignore
    const purchaseRequest = await program.account.purchaseRequest.fetch(
      purchaseRequestPda
    );

    console.log("🔍 Purchase Request Info:");
    console.log("Raw data:", JSON.stringify(purchaseRequest, null, 2));

    // Collection Mint から Collection Config PDA を計算
    if (purchaseRequest.collectionMint) {
      console.log(
        `\n📋 Collection Mint: ${purchaseRequest.collectionMint.toString()}`
      );

      // Collection Config 確認
      // @ts-ignore
      const collectionConfigAccounts =
        await program.account.collectionConfig.all();
      console.log(
        `\n🏛️ All Collection Configs (${collectionConfigAccounts.length}):`
      );

      collectionConfigAccounts.forEach((config, index) => {
        console.log(`${index + 1}. PDA: ${config.publicKey.toString()}`);
        console.log(`   Seed: ${config.account.seed}`);
        console.log(
          `   Collection Mint: ${config.account.collectionMint.toString()}`
        );
        console.log(`   Authority: ${config.account.authority.toString()}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

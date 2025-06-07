import * as dotenv from "dotenv";
dotenv.config();

import { PublicKey } from "@solana/web3.js";
import { factoryPda, factoryProgramMethods } from "../common/program-methods";

async function main() {
  const { program } = factoryProgramMethods();

  console.log("🔍 Checking Collection Config PDAs:");

  const possibleSeeds = [
    "test-collection-2",
    "test-collection-dev-2",
    "default",
    "test-collection",
  ];

  for (const seed of possibleSeeds) {
    const collectionConfigPda = factoryPda(
      [Buffer.from("collection_config"), Buffer.from(seed)],
      program.programId
    );

    try {
      // @ts-ignore
      const collectionConfig = await program.account.collectionConfig.fetch(
        collectionConfigPda
      );
      console.log(`✅ Found: ${seed}`);
      console.log(`   PDA: ${collectionConfigPda.toString()}`);
      console.log(`   Name field: ${collectionConfig.name || "undefined"}`);
      console.log(`   Data: ${JSON.stringify(collectionConfig, null, 2)}`);

      // Collection Config の name フィールドで再計算
      if (collectionConfig.name) {
        const correctCollectionConfigPda = factoryPda(
          [
            Buffer.from("collection_config"),
            Buffer.from(collectionConfig.name),
          ],
          program.programId
        );
        console.log(
          `   Correct PDA (using name): ${correctCollectionConfigPda.toString()}`
        );
      }
      console.log("");
    } catch (error) {
      console.log(`❌ Not found: ${seed} (${collectionConfigPda.toString()})`);
    }
  }
}

main().catch(console.error);

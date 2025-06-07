import * as dotenv from "dotenv";
dotenv.config();

import { PublicKey } from "@solana/web3.js";
import { factoryPda, factoryProgramMethods } from "../common/program-methods";

async function main() {
  const { program } = factoryProgramMethods();

  const targetPda = new PublicKey(
    "FKUboq7YUhoU6U6zjqvdufHCszmtFDNzXcPMpveyizPn"
  );

  console.log(`🔍 Checking PDA: ${targetPda.toString()}`);

  try {
    // @ts-ignore
    const collectionConfig = await program.account.collectionConfig.fetch(
      targetPda
    );
    console.log("✅ Found!");
    console.log("Data:", JSON.stringify(collectionConfig, null, 2));
  } catch (error) {
    console.log("❌ Not found:", error.message);
  }

  // 手動でPDAを再計算
  const recalculatedPda = factoryPda(
    [Buffer.from("collection_config"), Buffer.from("Test Collection 2")],
    program.programId
  );

  console.log(`\n🔄 Recalculated PDA: ${recalculatedPda.toString()}`);
  console.log(`Match: ${targetPda.equals(recalculatedPda)}`);
}

main().catch(console.error);

import * as dotenv from "dotenv";
dotenv.config();

import { PublicKey } from "@solana/web3.js";
import { factoryPda, factoryProgramMethods } from "../common/program-methods";

async function main() {
  const { program } = factoryProgramMethods();

  try {
    // Global Config 確認
    const globalConfigPda = factoryPda(
      [Buffer.from("config")],
      program.programId
    );
    // @ts-ignore
    const globalConfig = await program.account.globalConfig.fetch(
      globalConfigPda
    );
    console.log("🏛️ Global Config:");
    console.log(`Authority: ${globalConfig.authority.toString()}`);
    console.log(`Deposit Target: ${globalConfig.depositTarget.toString()}`);
    console.log("");

    // Exchange Request確認
    const nftOwner = new PublicKey(
      "kLVTJRLJPif8QexEZZiobhyLXA9Gqvhziv7DXdVuNgE"
    );
    const exchangeRequestPda = factoryPda(
      [
        Buffer.from("exchange_request"),
        nftOwner.toBuffer(),
        Buffer.from("module-test-exchange-001"),
      ],
      program.programId
    );

    // @ts-ignore
    const exchangeRequest = await program.account.exchangeRequest.fetch(
      exchangeRequestPda
    );
    console.log("🔄 Exchange Request:");
    console.log(`NFT Mint: ${exchangeRequest.nftMint.toString()}`);
    console.log("");

    // NFT Mintから使用されるべきCollection Config PDAを逆算
    const nftMint = exchangeRequest.nftMint;

    // 考えられるCollection シード
    const possibleSeeds = [
      "test-collection-2",
      "test-collection-dev-2",
      "default",
      "test-collection",
    ];

    console.log("🔍 Checking possible Collection Config PDAs:");
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
        console.log(
          `   Collection Mint: ${collectionConfig.collectionMint.toString()}`
        );
        console.log(`   Authority: ${collectionConfig.authority.toString()}`);
        console.log("");
      } catch (error) {
        console.log(
          `❌ Not found: ${seed} (${collectionConfigPda.toString()})`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

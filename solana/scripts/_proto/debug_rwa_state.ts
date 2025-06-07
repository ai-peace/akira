import * as dotenv from "dotenv";
dotenv.config();

import { PublicKey } from "@solana/web3.js";
import { factoryProgramMethods } from "../common/program-methods";

async function main() {
  const rwaStatePda = new PublicKey(
    "5XN8V9n9KC1xv1Z3vX2BqwX3CDAFn3T7yovn5nzJeW8E"
  );

  const { program } = factoryProgramMethods();

  try {
    // @ts-ignore
    const rwaState = await program.account.rwaState.fetch(rwaStatePda);

    console.log("🔍 RWA State Info:");
    console.log("Raw data:", JSON.stringify(rwaState, null, 2));
  } catch (error) {
    console.error("❌ Error fetching RWA State:", error);
  }
}

main().catch(console.error);

import * as dotenv from "dotenv";

dotenv.config();

import { factoryPda, factoryProgramMethods } from "../../common/program-methods";

async function main() {
  const { program } = factoryProgramMethods();

  const globalConfigPda = factoryPda(
    [Buffer.from("config")],
    program.programId
  );

  try {
    // @ts-ignore
    const configAccount = await program.account.globalConfig.fetch(
      globalConfigPda
    );

    console.log("\n🎉 === GLOBAL CONFIG ===");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Config PDA:", globalConfigPda.toString());
    console.log("👤 Admin:", configAccount.admin.toString());
    console.log("💰 Deposit Target:", configAccount.depositTarget.toString());
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Error:", error);

    return;
  }
}

main().catch(console.error);

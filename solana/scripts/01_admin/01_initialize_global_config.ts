import * as dotenv from "dotenv";

dotenv.config();

import * as anchor from "@coral-xyz/anchor";
import {
  factoryAdminWallet,
  factoryPda,
  factoryProgramMethods,
} from "../common/program-methods";
import { scriptConsts } from "../consts/scriptConsts";

// IDLをファイルから読み込み
const idlPath = "./target/idl/akira_solana.json";

async function main() {
  const { program, wallet } = factoryProgramMethods();

  const globalConfigPda = factoryPda(
    [Buffer.from("config")],
    program.programId
  );

  try {
    try {
      // @ts-ignore
      const configAccount = await program.account.globalConfig.fetch(
        globalConfigPda
      );

      console.log("\n🎉 === GLOBAL CONFIG ALREADY EXISTS ===");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📋 Config PDA:", globalConfigPda.toString());
      console.log("👤 Admin:", configAccount.admin.toString());
      console.log("💰 Deposit Target:", configAccount.depositTarget.toString());
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } catch (error) {
      // アカウントがない場合は作るがそうではない場合はエラーを投げる
      if (!`${error}`.includes("Account does not exist or has no data")) {
        throw error;
      }

      const tx = await program.methods
        .initializeConfig(wallet.publicKey) // deposit_target は管理者ウォレット
        .accounts({
          globalConfig: globalConfigPda,
          admin: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Global Config Initialized Successfully!");
      console.log("🔗 Transaction:", tx);

      console.log("\n🎉 === GLOBAL CONFIG SUCCESS ===");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📋 Config PDA:", globalConfigPda.toString());
      console.log("👤 Admin:", wallet.publicKey.toString());
      console.log("💰 Deposit Target:", wallet.publicKey.toString());
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      console.log("\n🔗 EXPLORER LINKS:");
      console.log(
        `🔗 Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`
      );
      console.log(
        `📋 Config: https://explorer.solana.com/address/${globalConfigPda.toString()}?cluster=devnet`
      );
      return;
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

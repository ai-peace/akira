import * as dotenv from "dotenv";

dotenv.config();

import { PublicKey } from "@solana/web3.js";
import { factoryPda, factoryProgramMethods } from "../common/program-methods";
import { scriptProperties } from "../consts/scriptProperties";

async function main() {
  // コマンドライン引数
  const depositTargetPublicKey = process.argv[2]
    ? new PublicKey(process.argv[2])
    : null;

  const { program, wallet, keypair } = factoryProgramMethods();

  const globalConfigPda = factoryPda(
    [Buffer.from("config")],
    program.programId
  );

  try {
    const tx = await program.methods
      .updateDepositTarget(depositTargetPublicKey)
      .accounts({
        globalConfig: globalConfigPda,
        admin: wallet.publicKey,
      })
      .signers([keypair])
      .rpc();

    console.log("DepositTarget更新成功 デポジット先のWalletが更新されました。");
    console.log(
      `Solana Explorerで確認: https://explorer.solana.com/tx/${tx}?cluster=${scriptProperties.solanaNetwork}`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

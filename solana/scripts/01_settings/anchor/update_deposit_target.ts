import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import * as path from "path";
import {
  factoryKeypairFromLocal,
  factoryPda,
  factoryProgramMethods,
  factoryWallet,
} from "../../00_common/program-methods";

// プログラムID
const PROGRAM_ID = new PublicKey(
  "7imdRzjtg5ao34crVKZSfudYiaZtFXa4Y65tFGQWQETg"
);

const IDL_PATH = path.join(__dirname, "../../../target/idl/akira_solana.json");

// メイン関数
async function main() {
  // コマンドライン引数
  const depositTargetPublicKey = process.argv[2]
    ? new PublicKey(process.argv[2])
    : null;

  if (!depositTargetPublicKey) {
    console.error(
      "送付先PDAを指定してください。例: pnpm tsx scripts/01_settings/anchor/initialize_config.ts [送付先PDA]"
    );
    process.exit(1);
  }

  try {
    const pda = factoryPda([Buffer.from("config")], PROGRAM_ID);
    const keypair = factoryKeypairFromLocal(
      process.env.HOME + "/.config/solana/id.json"
    );
    const providerWallet = factoryWallet(keypair);
    const adminPublicKey = providerWallet.publicKey;

    const { program } = factoryProgramMethods({
      providerWallet,
      rpcUrl: "http://127.0.0.1:8899",
      idlPath: IDL_PATH,
    });

    const tx = await program.methods
      .updateDepositTarget(depositTargetPublicKey)
      .accounts({
        globalConfig: pda,
        admin: adminPublicKey,
      })
      .signers([keypair])
      .rpc();

    console.log("DepositTarget更新成功 デポジット先のWalletが更新されました。");
    console.log(
      `Solana Explorerで確認: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
  } catch (error) {
    console.error("エラー:", error);
  }
}

// スクリプト実行
main();

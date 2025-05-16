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
  try {
    const keypair = factoryKeypairFromLocal(
      process.env.HOME + "/.config/solana/id.json"
    );
    const providerWallet = factoryWallet(keypair);
    const { program } = factoryProgramMethods({
      providerWallet,
      rpcUrl: "http://127.0.0.1:8899",
      idlPath: IDL_PATH,
    });

    const pda = factoryPda([Buffer.from("config")], PROGRAM_ID);

    // @ts-ignore
    const configAccount = await program.account.globalConfig.fetch(pda);

    console.log("admin:", configAccount.admin.toString());
    console.log("depositTarget:", configAccount.depositTarget.toString());
  } catch (error) {
    console.error("エラー:", error);
  }
}

// スクリプト実行
main();

import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import * as path from "path";
import {
  factoryKeypairFromLocal,
  factoryPda,
  factoryProgramMethods,
  factoryWallet,
} from "../../00_common/program-methods";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

// プログラムID
const PROGRAM_ID = new PublicKey(
  "7imdRzjtg5ao34crVKZSfudYiaZtFXa4Y65tFGQWQETg"
);

const IDL_PATH = path.join(__dirname, "../../../target/idl/akira_solana.json");

// メイン関数
async function main() {
  // コマンドライン引数
  const requestId = process.argv[2];
  const depositAmount = process.argv[3]
    ? parseInt(process.argv[3])
    : Math.floor(0.05 * LAMPORTS_PER_SOL);

  if (!requestId) {
    console.error(
      "リクエストIDを指定してください。例: pnpm tsx scripts/02_deposit/anchor/02_deposit_funds.ts [リクエストID] [入金額]"
    );
    process.exit(1);
  }

  console.log("リクエストID:", requestId);
  console.log(
    "入金額:",
    depositAmount,
    "lamports (◎",
    depositAmount / LAMPORTS_PER_SOL,
    "SOL)"
  );

  try {
    // キーペア読み込み
    const keypair = factoryKeypairFromLocal(
      process.env.HOME + "/.config/solana/id.json"
    );
    const providerWallet = factoryWallet(keypair);
    console.log("ウォレットアドレス:", providerWallet.publicKey.toString());

    // PDAを計算
    const purchasePda = factoryPda(
      [
        Buffer.from("purchase_request"),
        providerWallet.publicKey.toBuffer(),
        Buffer.from(requestId),
      ],
      PROGRAM_ID
    );
    console.log("購入リクエストPDA:", purchasePda.toString());

    // 設定PDAを計算
    const configPda = factoryPda([Buffer.from("config")], PROGRAM_ID);
    console.log("設定PDA:", configPda.toString());

    // プログラムセットアップ
    const { program } = factoryProgramMethods({
      providerWallet,
      rpcUrl: "http://127.0.0.1:8899",
      idlPath: IDL_PATH,
    });

    // 設定アカウントから送付先を取得（TypeScriptエラー回避のためanyを使用）
    const programAny = program as any;
    const configAccount = await programAny.account.globalConfig.fetch(
      configPda
    );
    const depositTarget = configAccount.depositTarget;
    console.log("送付先アドレス:", depositTarget.toString());

    // deposit_funds命令を実行
    const tx = await program.methods
      .depositFunds(new anchor.BN(depositAmount))
      .accounts({
        purchaseRequest: purchasePda,
        owner: providerWallet.publicKey,
        globalConfig: configPda,
        depositAccount: depositTarget,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();

    console.log("入金成功!");
    console.log("トランザクション:", tx);
    console.log(
      `Solana Explorerで確認: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
  } catch (error) {
    console.error("エラー:", error);
  }
}

// ヘルプ表示判定
if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  console.log(`
使用方法: pnpm tsx scripts/02_deposit/anchor/02_deposit_funds.ts [オプション]

オプション:
  リクエストID      - 入金対象の購入リクエストID（必須）
  [入金額(lamports)] - 入金額（省略時は0.05 SOL）

例:
  pnpm tsx scripts/02_deposit/anchor/02_deposit_funds.ts my-request-1 50000000
  `);
} else {
  // スクリプト実行
  main();
}

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";

// プログラムID
const PROGRAM_ID = new PublicKey(
  "7imdRzjtg5ao34crVKZSfudYiaZtFXa4Y65tFGQWQETg"
);

// メイン関数
async function main() {
  // コマンドライン引数
  const depositTarget = process.argv[2] ? new PublicKey(process.argv[2]) : null;

  if (!depositTarget) {
    console.error(
      "送付先PDAを指定してください。例: pnpm tsx new-scripts/deploy-init.ts [送付先PDA]"
    );
    process.exit(1);
  }

  try {
    // 接続設定
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");

    // キーペア読み込み
    const keypairPath = process.env.HOME + "/.config/solana/id.json";
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
    const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

    // ウォレットとプロバイダー設定
    const wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    anchor.setProvider(provider);

    console.log("ウォレットアドレス:", wallet.publicKey.toString());
    console.log("送付先PDA:", depositTarget.toString());

    // IDLからプログラムを取得
    const idl = JSON.parse(
      fs.readFileSync("./target/idl/akira_solana.json", "utf-8")
    );
    // @ts-ignore - なぜかタイプエラーが出るので無視
    const program = new anchor.Program(
      idl,
      new PublicKey(PROGRAM_ID),
      provider
    );

    // グローバル設定PDAを計算
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    console.log("設定PDA:", configPda.toString());

    // グローバル設定を初期化
    const tx = await program.methods
      .initializeConfig(depositTarget)
      .accounts({
        globalConfig: configPda,
        admin: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("トランザクション成功:", tx);
    console.log(
      `Solana Explorerで確認: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
  } catch (error) {
    console.error("エラー:", error);
  }
}

// スクリプト実行
main();

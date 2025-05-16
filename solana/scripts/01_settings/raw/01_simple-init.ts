import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
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
      "送付先PDAを指定してください。例: pnpm tsx new-scripts/simple-init.ts [送付先PDA]"
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

    console.log("ウォレットアドレス:", keypair.publicKey.toString());
    console.log("送付先PDA:", depositTarget.toString());

    // グローバル設定PDAを計算
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    );
    console.log("設定PDA:", configPda.toString());

    // initializeConfig命令のディスクリミネータ（IDLから取得）
    const discriminator = Buffer.from([208, 127, 21, 1, 194, 190, 196, 70]);

    // 命令データを作成
    const data = Buffer.concat([discriminator, depositTarget.toBuffer()]);

    // トランザクション命令を作成
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data,
    });

    // トランザクションを作成して実行
    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      keypair,
    ]);

    console.log("トランザクション成功:", signature);
    console.log(
      `Solana Explorerで確認: https://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
  } catch (error) {
    console.error("エラー:", error);
  }
}

// スクリプト実行
main();

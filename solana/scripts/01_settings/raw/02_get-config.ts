import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";

// プログラムID
const PROGRAM_ID = new PublicKey(
  "7imdRzjtg5ao34crVKZSfudYiaZtFXa4Y65tFGQWQETg"
);

// アカウントデータをパースする関数
function parseGlobalConfig(data: Buffer): {
  admin: PublicKey;
  depositTarget: PublicKey;
} {
  // アカウントのディスクリミネータをスキップ (8バイト)
  const dataSlice = data.slice(8);

  // 管理者のPublicKey (32バイト)
  const admin = new PublicKey(dataSlice.slice(0, 32));

  // 送付先のPublicKey (32バイト)
  const depositTarget = new PublicKey(dataSlice.slice(32, 64));

  return { admin, depositTarget };
}

// メイン関数
async function main() {
  try {
    // 接続設定
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");

    // グローバル設定PDAを計算
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    );
    console.log("設定PDA:", configPda.toString());

    // アカウント情報を取得
    const accountInfo = await connection.getAccountInfo(configPda);

    if (!accountInfo) {
      console.log(
        "アカウントが見つかりません。まだ初期化されていない可能性があります。"
      );
      process.exit(1);
    }

    console.log("アカウント情報:");
    console.log("所有者:", accountInfo.owner.toString());
    console.log("実行可能:", accountInfo.executable);
    console.log("lamports:", accountInfo.lamports);
    console.log("データサイズ:", accountInfo.data.length, "バイト");

    // アカウントデータをパース
    const configData = parseGlobalConfig(accountInfo.data);

    console.log("\nグローバル設定:");
    console.log("管理者:", configData.admin.toString());
    console.log("送付先:", configData.depositTarget.toString());

    // PublicKeyが切り詰められていないか確認
    if (
      configData.admin.toString().length !== 44 ||
      configData.depositTarget.toString().length !== 44
    ) {
      console.warn("\n警告: PublicKeyが正しく表示されていない可能性があります");
    }
  } catch (error) {
    console.error("エラー:", error);

    if (error instanceof Error && error.message.includes("PublicKey")) {
      console.error("PublicKeyの処理中にエラーが発生しました。");
      console.error("バイトデータが無効である可能性があります。");
    }

    process.exit(1);
  }
}

// スクリプト実行
main();

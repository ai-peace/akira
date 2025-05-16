import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as path from "path";
import {
  factoryKeypairFromLocal,
  factoryProgramMethods,
  factoryWallet,
} from "../../00_common/program-methods";

const IDL_PATH = path.join(__dirname, "../../../target/idl/akira_solana.json");

// リクエストのステータス名（順序はRustのenumに一致）
const REQUEST_STATUS = [
  "Created",
  "Funded",
  "Completed",
  "Redeemed",
  "Cancelled",
];

// メイン関数
async function main() {
  try {
    // キーペア読み込み
    const keypair = factoryKeypairFromLocal(
      process.env.HOME + "/.config/solana/id.json"
    );
    const providerWallet = factoryWallet(keypair);

    // プログラムセットアップ
    const { program } = factoryProgramMethods({
      providerWallet,
      rpcUrl: "http://127.0.0.1:8899",
      idlPath: IDL_PATH,
    });

    // TypeScriptエラー回避のためanyを使用
    const programAny = program as any;

    // すべての購入リクエストアカウントを取得
    const accounts = await programAny.account.purchaseRequest.all();

    if (accounts.length === 0) {
      console.log("購入リクエストは見つかりませんでした。");
      return;
    }

    console.log(`購入リクエスト一覧（${accounts.length}件）:`);
    console.log(
      "--------------------------------------------------------------------------------"
    );
    console.log(
      "| PDA                                          | リクエストID    | 状態     | 価格    | 入金    | 充足率 |"
    );
    console.log(
      "--------------------------------------------------------------------------------"
    );

    for (const item of accounts) {
      const acc = item.account;
      const pubkey = item.publicKey;

      // ステータスのマッピング
      // Anchorのenumは {created: {}} のような形式で返されるため、オブジェクトのキーを取得
      const statusKey = Object.keys(acc.status)[0];
      const statusIndex = REQUEST_STATUS.findIndex(
        (s) => s.toLowerCase() === statusKey
      );
      const statusName =
        statusIndex >= 0 ? REQUEST_STATUS[statusIndex] : statusKey;

      // SOL表示のための計算
      const priceSOL = Number(acc.priceEstimate) / LAMPORTS_PER_SOL;
      const depositSOL = Number(acc.depositAmount) / LAMPORTS_PER_SOL;
      const percent =
        acc.priceEstimate.toString() === "0"
          ? 0
          : (Number(acc.depositAmount) * 100) / Number(acc.priceEstimate);

      // 完全なPublicKeyを表示（切り詰めない）
      console.log(
        `| ${pubkey.toString()} | ${acc.requestId.padEnd(
          14
        )} | ${statusName.padEnd(8)} | ◎${priceSOL
          .toFixed(2)
          .padStart(5)} | ◎${depositSOL.toFixed(2).padStart(5)} | ${percent
          .toFixed(0)
          .padStart(3)}%  |`
      );
    }

    console.log(
      "--------------------------------------------------------------------------------"
    );
    console.log(
      "\n詳細情報を見るには: pnpm tsx scripts/02_deposit/anchor/04_get_purchase_info.ts [PDA]"
    );
  } catch (error) {
    console.error("エラー:", error);
  }
}

// スクリプト実行
main();

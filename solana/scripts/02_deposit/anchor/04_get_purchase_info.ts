import { PublicKey } from "@solana/web3.js";
import * as path from "path";
import {
  factoryKeypairFromLocal,
  factoryProgramMethods,
  factoryWallet,
} from "../../00_common/program-methods";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

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
  // コマンドライン引数
  const purchasePdaStr = process.argv[2];

  if (!purchasePdaStr) {
    console.error(
      "購入リクエストPDAを指定してください。例: pnpm tsx scripts/02_deposit/anchor/04_get_purchase_info.ts [PDA]"
    );
    process.exit(1);
  }

  try {
    // 入力されたPDAをパース
    const purchasePda = new PublicKey(purchasePdaStr);

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

    // アカウント情報を取得
    console.log("購入リクエスト詳細を取得中...");
    const purchaseAccount = await programAny.account.purchaseRequest.fetch(
      purchasePda
    );

    // ステータスのマッピング
    // Anchorのenumは {created: {}} のような形式で返されるため、オブジェクトのキーを取得
    const statusKey = Object.keys(purchaseAccount.status)[0];
    const statusIndex = REQUEST_STATUS.findIndex(
      (s) => s.toLowerCase() === statusKey
    );
    const statusName =
      statusIndex >= 0 ? REQUEST_STATUS[statusIndex] : statusKey;

    // 情報を表示
    console.log(
      "\n===================== 購入リクエスト詳細 ====================="
    );
    console.log(`PDA: ${purchasePda.toString()}`);
    console.log(`リクエストID: ${purchaseAccount.requestId}`);
    console.log(`所有者: ${purchaseAccount.owner.toString()}`);
    console.log(`状態: ${statusName}`);
    console.log(`メタデータURI: ${purchaseAccount.metadataUri}`);
    console.log(
      `予想価格: ◎${
        Number(purchaseAccount.priceEstimate) / LAMPORTS_PER_SOL
      } SOL (${purchaseAccount.priceEstimate.toString()} lamports)`
    );
    console.log(
      `入金額: ◎${
        Number(purchaseAccount.depositAmount) / LAMPORTS_PER_SOL
      } SOL (${purchaseAccount.depositAmount.toString()} lamports)`
    );

    // 充足率を計算
    const fulfillmentPercentage =
      purchaseAccount.priceEstimate.toString() === "0"
        ? 0
        : (Number(purchaseAccount.depositAmount) * 100) /
          Number(purchaseAccount.priceEstimate);
    console.log(`充足率: ${fulfillmentPercentage.toFixed(1)}%`);

    // 作成時間（Unixタイムスタンプをフォーマット）
    const creationDate = new Date(Number(purchaseAccount.timestamp) * 1000);
    console.log(`作成日時: ${creationDate.toLocaleString()}`);

    // RWA Mint（設定されている場合）
    if (purchaseAccount.rwaMint) {
      console.log(`RWA Mint: ${purchaseAccount.rwaMint.toString()}`);
    } else {
      console.log("RWA Mint: 未設定");
    }

    // 購入確認（設定されている場合）
    console.log(
      `購入確認: ${purchaseAccount.purchaseConfirmation || "未設定"}`
    );

    // ストレージID（設定されている場合）
    console.log(`ストレージID: ${purchaseAccount.storageId || "未設定"}`);

    // 管理者
    console.log(`管理者: ${purchaseAccount.adminAuthority.toString()}`);

    // キャンセル理由（設定されている場合）
    if (purchaseAccount.cancellationReason) {
      console.log(`キャンセル理由: ${purchaseAccount.cancellationReason}`);
    }

    console.log("============================================================");
  } catch (error) {
    console.error("エラー:", error);
  }
}

// ヘルプ表示判定
if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  console.log(`
使用方法: pnpm tsx scripts/02_deposit/anchor/04_get_purchase_info.ts [PDA]

引数:
  PDA - 購入リクエストのPDA（必須）

例:
  pnpm tsx scripts/02_deposit/anchor/04_get_purchase_info.ts 8YvHijNqwQMHgRjVQ5Ngxz3xQQa5ES7xQxmkiMerx2AL
  `);
} else {
  // スクリプト実行
  main();
}

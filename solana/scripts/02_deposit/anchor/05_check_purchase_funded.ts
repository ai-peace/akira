import { PublicKey } from "@solana/web3.js";
import * as path from "path";
import {
  factoryKeypairFromLocal,
  factoryProgramMethods,
  factoryWallet,
} from "../../00_common/program-methods";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const IDL_PATH = path.join(__dirname, "../../../target/idl/akira_solana.json");

// メイン関数
async function main() {
  // コマンドライン引数
  const purchasePdaStr = process.argv[2];

  if (!purchasePdaStr) {
    console.error(
      "購入リクエストPDAを指定してください。例: pnpm tsx scripts/02_deposit/anchor/05_check_purchase_funded.ts [PDA]"
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
    console.log("購入リクエスト状態を確認中...");

    // 購入リクエストアカウントの情報を取得
    const purchaseAccount = await programAny.account.purchaseRequest.fetch(
      purchasePda
    );

    // クライアント側でFundedかどうかを判断（プログラムのロジックと同じ）
    const isFunded =
      // ステータスが"funded"かどうか
      Object.keys(purchaseAccount.status)[0] === "funded" ||
      // または必要な金額以上が入金されているか
      Number(purchaseAccount.depositAmount) >=
        Number(purchaseAccount.priceEstimate);

    // 充足率を計算
    const fulfillmentPercentage =
      purchaseAccount.priceEstimate.toString() === "0"
        ? 0
        : (Number(purchaseAccount.depositAmount) * 100) /
          Number(purchaseAccount.priceEstimate);

    console.log(
      "\n===================== ファンディング状態 ====================="
    );
    console.log(`PDA: ${purchasePda.toString()}`);
    console.log(`リクエストID: ${purchaseAccount.requestId}`);
    console.log(
      `予想価格: ◎${
        Number(purchaseAccount.priceEstimate) / LAMPORTS_PER_SOL
      } SOL`
    );
    console.log(
      `入金額: ◎${Number(purchaseAccount.depositAmount) / LAMPORTS_PER_SOL} SOL`
    );
    console.log(`充足率: ${fulfillmentPercentage.toFixed(1)}%`);
    console.log(`ステータス: ${Object.keys(purchaseAccount.status)[0]}`);
    console.log(
      `必要資金条件を満たしているか: ${isFunded ? "はい ✅" : "いいえ ❌"}`
    );
    console.log(`NFTミント可能: ${isFunded ? "はい ✅" : "いいえ ❌"}`);
    console.log("============================================================");

    if (!isFunded) {
      const remainingAmount =
        Number(purchaseAccount.priceEstimate) -
        Number(purchaseAccount.depositAmount);
      console.log(
        `\nNFTをミントするには、さらに ◎${
          remainingAmount / LAMPORTS_PER_SOL
        } SOL の入金が必要です。`
      );
      console.log(
        `入金コマンド: pnpm tsx scripts/02_deposit/anchor/02_deposit_funds.ts ${purchaseAccount.requestId} ${remainingAmount}`
      );
    } else {
      console.log(
        "\nNFTをミントできる状態です。ミントコマンドを実行できます。"
      );
    }
  } catch (error) {
    console.error("エラー:", error);
  }
}

// ヘルプ表示判定
if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  console.log(`
使用方法: pnpm tsx scripts/02_deposit/anchor/05_check_purchase_funded.ts [PDA]

引数:
  PDA - 購入リクエストのPDA（必須）

例:
  pnpm tsx scripts/02_deposit/anchor/05_check_purchase_funded.ts 8YvHijNqwQMHgRjVQ5Ngxz3xQQa5ES7xQxmkiMerx2AL
  `);
} else {
  // スクリプト実行
  main();
}

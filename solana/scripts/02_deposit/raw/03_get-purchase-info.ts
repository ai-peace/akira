import { Connection, PublicKey } from "@solana/web3.js";

// プログラムID
const PROGRAM_ID = new PublicKey(
  "7imdRzjtg5ao34crVKZSfudYiaZtFXa4Y65tFGQWQETg"
);

// リクエストのステータス名
const REQUEST_STATUS = [
  "Created",
  "Funded",
  "Completed",
  "Redeemed",
  "Cancelled",
];

// アカウントデータをパースする関数
function parsePurchaseRequest(data: Buffer): any {
  // アカウントのディスクリミネータをスキップ (8バイト)
  let offset = 8;

  // owner: Pubkey (32バイト)
  const owner = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  // request_id: String
  const requestIdLen = data.readUInt32LE(offset);
  offset += 4;
  const requestId = data.slice(offset, offset + requestIdLen).toString();
  offset += requestIdLen;

  // metadata_uri: String
  const metadataUriLen = data.readUInt32LE(offset);
  offset += 4;
  const metadataUri = data.slice(offset, offset + metadataUriLen).toString();
  offset += metadataUriLen;

  // price_estimate: u64 (8バイト)
  const priceEstimate = data.readBigUInt64LE(offset);
  offset += 8;

  // status: enum (1バイト)
  const statusIndex = data[offset];
  const status = REQUEST_STATUS[statusIndex] || "Unknown";
  offset += 1;

  // deposit_amount: u64 (8バイト)
  const depositAmount = data.readBigUInt64LE(offset);
  offset += 8;

  // timestamp: i64 (8バイト)
  const timestamp = data.readBigInt64LE(offset);
  offset += 8;

  // admin_authority: Pubkey (32バイト)
  const adminAuthority = new PublicKey(data.slice(offset, offset + 32));

  // タイムスタンプのフォーマット
  let formattedDate = "不明";
  try {
    if (timestamp > 0) {
      formattedDate = new Date(Number(timestamp) * 1000).toISOString();
    }
  } catch (e) {
    formattedDate = `変換エラー: ${timestamp.toString()}`;
  }

  return {
    owner: owner.toString(),
    requestId,
    metadataUri,
    priceEstimate: priceEstimate.toString(),
    status,
    depositAmount: depositAmount.toString(),
    timestamp: timestamp.toString(),
    formattedDate,
    adminAuthority: adminAuthority.toString(),
  };
}

// メイン関数
async function main() {
  // コマンドライン引数
  const purchaseAddressStr = process.argv[2];

  if (!purchaseAddressStr) {
    console.error(
      "購入リクエストPDAを指定してください。例: pnpm tsx new-scripts/get-purchase-info.ts [PDA]"
    );
    process.exit(1);
  }

  try {
    // PublicKeyに変換（ここでエラーハンドリングを追加）
    let purchaseAddress;
    try {
      purchaseAddress = new PublicKey(purchaseAddressStr);
    } catch (error) {
      console.error(`無効なPublicKeyフォーマットです: ${purchaseAddressStr}`);
      console.error(
        "正しいSolana PublicKeyを指定してください（Base58エンコードの44文字程度）"
      );
      process.exit(1);
    }

    // 接続設定
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");

    // アカウント情報を取得
    const accountInfo = await connection.getAccountInfo(purchaseAddress);

    if (!accountInfo) {
      console.log("アカウントが見つかりません。");
      process.exit(1);
    }

    console.log("アカウント情報:", {
      owner: accountInfo.owner.toString(),
      executable: accountInfo.executable,
      lamports: accountInfo.lamports,
      dataSize: accountInfo.data.length,
    });

    // アカウントデータをパース
    const purchaseData = parsePurchaseRequest(accountInfo.data);

    console.log("\n購入リクエスト情報:");
    console.log("オーナー:", purchaseData.owner);
    console.log("リクエストID:", purchaseData.requestId);
    console.log("メタデータURI:", purchaseData.metadataUri);
    console.log(
      "予想価格:",
      purchaseData.priceEstimate,
      "lamports (◎",
      Number(purchaseData.priceEstimate) / 1000000000,
      "SOL)"
    );
    console.log("ステータス:", purchaseData.status);
    console.log(
      "入金額:",
      purchaseData.depositAmount,
      "lamports (◎",
      Number(purchaseData.depositAmount) / 1000000000,
      "SOL)"
    );
    console.log("作成日時:", purchaseData.formattedDate);
    console.log("管理者キー:", purchaseData.adminAuthority);

    // 資金充足率を計算
    const percent = (
      (BigInt(purchaseData.depositAmount) * BigInt(100)) /
      BigInt(purchaseData.priceEstimate)
    ).toString();
    console.log("資金充足率:", percent, "%");

    // SOL表記への変換を追加（1 SOL = 1,000,000,000 lamports）
    const LAMPORTS_PER_SOL = 1000000000;
    const priceEstimateSOL =
      Number(purchaseData.priceEstimate) / LAMPORTS_PER_SOL;
    const depositAmountSOL =
      Number(purchaseData.depositAmount) / LAMPORTS_PER_SOL;

    console.log("\n金額情報（SOL表記）:");
    console.log("予想価格: ◎", priceEstimateSOL.toFixed(9), "SOL");
    console.log("入金額: ◎", depositAmountSOL.toFixed(9), "SOL");
    console.log(
      "残り必要額: ◎",
      (priceEstimateSOL - depositAmountSOL).toFixed(9),
      "SOL"
    );
  } catch (error) {
    console.error("エラー:", error);
  }
}

// スクリプト実行
main();

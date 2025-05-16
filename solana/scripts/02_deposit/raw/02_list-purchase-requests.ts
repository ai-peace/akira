import { Connection, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

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

// アカウントデータをパースする関数（必要に応じて簡易版）
function parsePurchaseRequest(data: Buffer): any {
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

  // 残りのフィールドは必要に応じて追加可能

  return {
    owner: owner.toString(),
    requestId,
    status,
    priceEstimate: priceEstimate.toString(),
    depositAmount: depositAmount.toString(),
  };
}

async function main() {
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  // PurchaseRequestアカウントの discriminator
  const discriminator = Buffer.from([223, 94, 33, 8, 75, 147, 214, 83]);
  // 全アカウントを取得
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [{ memcmp: { offset: 0, bytes: bs58.encode(discriminator) } }],
  });
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

  const LAMPORTS_PER_SOL = 1000000000;

  for (const acc of accounts) {
    const info = parsePurchaseRequest(acc.account.data);
    const priceSOL = Number(info.priceEstimate) / LAMPORTS_PER_SOL;
    const depositSOL = Number(info.depositAmount) / LAMPORTS_PER_SOL;
    const percent =
      (Number(info.depositAmount) * 100) / Number(info.priceEstimate);

    // 完全なPublicKeyを表示（切り詰めない）
    console.log(
      `| ${acc.pubkey.toString()} | ${info.requestId.padEnd(
        14
      )} | ${info.status.padEnd(8)} | ◎${priceSOL
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
    "\n詳細情報を見るには: pnpm tsx new-scripts/get-purchase-info.ts [PDA]"
  );
}

main();

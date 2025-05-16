import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as fs from "fs";

// プログラムID
const PROGRAM_ID = new PublicKey(
  "7imdRzjtg5ao34crVKZSfudYiaZtFXa4Y65tFGQWQETg"
);

// 文字列のエンコード関数
function encodeString(str: string): Buffer {
  const strBytes = Buffer.from(str);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(strBytes.length, 0);
  return Buffer.concat([lenBuf, strBytes]);
}

// BigIntのエンコード関数
function encodeU64(val: number): Buffer {
  const buf = Buffer.alloc(8);
  let num = BigInt(val);
  for (let i = 0; i < 8; i++) {
    buf[i] = Number(num & BigInt(0xff));
    num = num >> BigInt(8);
  }
  return buf;
}

// グローバル設定PDAを計算
function getConfigPda(): PublicKey {
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
  return configPda;
}

// 購入リクエストPDAを計算
function getPurchasePda(
  ownerPublicKey: PublicKey,
  requestId: string
): PublicKey {
  const [purchasePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("purchase_request"),
      ownerPublicKey.toBuffer(),
      Buffer.from(requestId),
    ],
    PROGRAM_ID
  );
  return purchasePda;
}

// キーペアの読み込み
function loadWalletKeypair(): Keypair {
  const keypairPath = process.env.HOME + "/.config/solana/id.json";
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
}

// 購入リクエストを作成する
async function createPurchaseRequest(
  connection: Connection,
  keypair: Keypair,
  requestId: string,
  metadataUri: string,
  priceEstimate: number
): Promise<{ purchasePda: PublicKey; signature: string }> {
  console.log("ステップ1: 購入リクエストを作成中...");

  // PDAを計算
  const purchasePda = getPurchasePda(keypair.publicKey, requestId);
  console.log("購入リクエストPDA:", purchasePda.toString());

  // createPurchaseRequest命令のディスクリミネータ
  const createDiscriminator = Buffer.from([154, 78, 58, 3, 144, 59, 248, 157]);

  // 命令データを作成
  const createData = Buffer.concat([
    createDiscriminator,
    encodeString(requestId),
    encodeString(metadataUri),
    encodeU64(priceEstimate),
  ]);

  // トランザクション命令を作成
  const createInstruction = new TransactionInstruction({
    keys: [
      { pubkey: purchasePda, isSigner: false, isWritable: true },
      { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: keypair.publicKey, isSigner: false, isWritable: false }, // admin_authority
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data: createData,
  });

  // トランザクションを作成して実行
  const createTx = new Transaction().add(createInstruction);

  try {
    const signature = await sendAndConfirmTransaction(connection, createTx, [
      keypair,
    ]);

    console.log("購入リクエスト作成成功:", signature);
    return { purchasePda, signature };
  } catch (error) {
    console.error("購入リクエスト作成失敗:", error);
    throw new Error(`購入リクエスト作成に失敗しました: ${error.message}`);
  }
}

// 設定から送付先情報を取得
async function getDepositTarget(connection: Connection): Promise<PublicKey> {
  const configPda = getConfigPda();
  const configInfo = await connection.getAccountInfo(configPda);

  if (!configInfo) {
    throw new Error("設定アカウントが見つかりません");
  }

  // 送付先アドレス（設定の中からパース）
  const depositTarget = new PublicKey(
    configInfo.data.slice(8 + 32, 8 + 32 + 32)
  );
  console.log("送付先PDA:", depositTarget.toString());

  return depositTarget;
}

// 資金を入金する
async function depositFunds(
  connection: Connection,
  keypair: Keypair,
  purchasePda: PublicKey,
  depositAmount: number
): Promise<string> {
  console.log("\nステップ2: 資金を入金中...");
  console.log(
    "入金額:",
    depositAmount,
    "lamports (◎",
    depositAmount / LAMPORTS_PER_SOL,
    "SOL)"
  );

  // depositFunds命令のディスクリミネータ
  const depositDiscriminator = Buffer.from([202, 39, 52, 211, 53, 20, 250, 88]);

  // 設定から送付先情報を取得
  const depositTarget = await getDepositTarget(connection);
  const configPda = getConfigPda();

  // 命令データを作成
  const depositData = Buffer.concat([
    depositDiscriminator,
    encodeU64(depositAmount),
  ]);

  // トランザクション命令を作成
  const depositInstruction = new TransactionInstruction({
    keys: [
      { pubkey: purchasePda, isSigner: false, isWritable: true },
      { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: depositTarget, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data: depositData,
  });

  // トランザクションを作成して実行
  const depositTx = new Transaction().add(depositInstruction);

  try {
    const signature = await sendAndConfirmTransaction(connection, depositTx, [
      keypair,
    ]);

    console.log("入金成功:", signature);
    return signature;
  } catch (error) {
    console.error("入金失敗:", error);
    throw new Error(`入金に失敗しました: ${error.message}`);
  }
}

// メイン関数
async function main() {
  try {
    // 接続設定
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");

    // キーペア読み込み
    const keypair = loadWalletKeypair();
    console.log("ウォレットアドレス:", keypair.publicKey.toString());

    // リクエストID（コマンドライン引数から取得するか、ランダム生成）
    const requestId =
      process.argv[2] || `req-${Math.floor(Math.random() * 1000000)}`;
    console.log("リクエストID:", requestId);

    // メタデータURI（コマンドライン引数から取得するか、デフォルト値）
    const metadataUri = process.argv[3] || "https://example.com/metadata.json";

    // 価格（コマンドライン引数から取得するか、デフォルト値: 0.1 SOL）
    const priceEstimate = process.argv[4]
      ? parseInt(process.argv[4])
      : 0.1 * LAMPORTS_PER_SOL;

    // 入金額（コマンドライン引数から取得するか、デフォルト値: 0.05 SOL）
    const depositAmount = process.argv[5]
      ? parseInt(process.argv[5])
      : 0.05 * LAMPORTS_PER_SOL;

    // 1. 購入リクエスト作成
    const { purchasePda } = await createPurchaseRequest(
      connection,
      keypair,
      requestId,
      metadataUri,
      priceEstimate
    );

    // 2. 入金処理
    await depositFunds(connection, keypair, purchasePda, depositAmount);

    console.log("\n処理完了");
    console.log("購入リクエストPDA:", purchasePda.toString());
    console.log(
      "詳細表示コマンド: pnpm tsx new-scripts/get-purchase-info.ts",
      purchasePda.toString()
    );
  } catch (error) {
    console.error("\nエラー:", error.message || error);
    process.exit(1);
  }
}

// コマンドライン引数のヘルプ表示
function showHelp() {
  console.log(`
使用方法: pnpm tsx new-scripts/create-and-deposit.ts [オプション]

オプション:
  [リクエストID]    - 購入リクエストのID（省略時はランダム生成）
  [メタデータURI]   - メタデータURI（省略時はデフォルト値）
  [価格(lamports)]  - 予想価格（省略時は0.1 SOL）
  [入金額(lamports)] - 入金額（省略時は0.05 SOL）

例:
  pnpm tsx new-scripts/create-and-deposit.ts my-request-1 https://example.com/meta.json 100000000 50000000
  `);
}

// ヘルプ表示判定
if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  showHelp();
} else {
  // スクリプト実行
  main();
}

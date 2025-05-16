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
  const requestId =
    process.argv[2] || `req-${Math.floor(Math.random() * 1000000)}`;
  const metadataUri = process.argv[3] || "https://example.com/metadata.json";
  const priceEstimate = process.argv[4]
    ? parseInt(process.argv[4])
    : Math.floor(0.1 * LAMPORTS_PER_SOL);

  console.log("リクエストID:", requestId);
  console.log("メタデータURI:", metadataUri);
  console.log(
    "予想価格:",
    priceEstimate,
    "lamports (◎",
    priceEstimate / LAMPORTS_PER_SOL,
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

    // プログラムセットアップ
    const { program } = factoryProgramMethods({
      providerWallet,
      rpcUrl: "http://127.0.0.1:8899",
      idlPath: IDL_PATH,
    });

    // 管理者としても同じアドレスを使用
    const adminPublicKey = providerWallet.publicKey;

    // create_purchase_request命令を実行
    const tx = await program.methods
      .createPurchaseRequest(
        requestId,
        metadataUri,
        new anchor.BN(priceEstimate)
      )
      .accounts({
        purchaseRequest: purchasePda,
        user: providerWallet.publicKey,
        adminAuthority: adminPublicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();

    console.log("購入リクエスト作成成功!");
    console.log("トランザクション:", tx);
    console.log(
      `Solana Explorerで確認: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
    console.log(
      "\n次のステップ: pnpm tsx scripts/02_deposit/anchor/02_deposit_funds.ts",
      requestId,
      priceEstimate / 2
    );
  } catch (error) {
    console.error("エラー:", error);
  }
}

// ヘルプ表示判定
if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  console.log(`
使用方法: pnpm tsx scripts/02_deposit/anchor/01_create_purchase_request.ts [オプション]

オプション:
  [リクエストID]    - 購入リクエストのID（省略時はランダム生成）
  [メタデータURI]   - メタデータURI（省略時はデフォルト値）
  [価格(lamports)]  - 予想価格（省略時は0.1 SOL）

例:
  pnpm tsx scripts/02_deposit/anchor/01_create_purchase_request.ts my-request-1 https://example.com/meta.json 100000000
  `);
} else {
  // スクリプト実行
  main();
}

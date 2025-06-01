import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { factoryProgramMethods } from "../common/program-methods";
import { scriptConsts } from "../consts/scriptConsts";

async function main() {
  const requestId = process.argv[2];
  const ownerAddress = process.argv[3]; // オプション: 特定のオーナーアドレス

  if (!requestId) {
    console.error("❌ Request ID is required");
    console.log(
      "Usage: pnpm tsx scripts/02_deposit/04_is_purchase_request_funded.ts <request_id> [owner_address]"
    );
    console.log(
      "Example: pnpm tsx scripts/02_deposit/04_is_purchase_request_funded.ts my-request-123"
    );
    process.exit(1);
  }

  const { program, wallet } = factoryProgramMethods();

  // オーナーアドレスの決定（指定されていない場合は現在のウォレット）
  const owner = ownerAddress ? new PublicKey(ownerAddress) : wallet.publicKey;

  // Purchase Request PDA計算
  const [purchaseRequestPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("purchase_request"), owner.toBuffer(), Buffer.from(requestId)],
    scriptConsts.PROGRAM_ID
  );

  try {
    console.log(`🔍 Checking funding status for request: ${requestId}`);
    console.log(`👤 Owner: ${owner.toString()}`);
    console.log(`📍 PDA Address: ${purchaseRequestPda.toString()}`);

    // Purchase Requestデータを直接取得してチェック
    // @ts-ignore
    const purchaseRequest = await program.account.purchaseRequest.fetch(
      purchaseRequestPda
    );

    // 資金状況の計算
    const priceEstimate = purchaseRequest.priceEstimate.toNumber();
    const depositAmount = purchaseRequest.depositAmount.toNumber();
    const isFunded = depositAmount >= priceEstimate;
    const remainingAmount = Math.max(0, priceEstimate - depositAmount);
    const status = Object.keys(purchaseRequest.status)[0];

    console.log(`\n💰 Funding Status Check:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🆔 Request ID: ${requestId}`);
    console.log(`💰 Price Estimate: ${priceEstimate / LAMPORTS_PER_SOL} SOL`);
    console.log(`💳 Current Deposit: ${depositAmount / LAMPORTS_PER_SOL} SOL`);
    console.log(`📊 Status: ${status}`);

    if (isFunded) {
      console.log(`✅ FUNDED: Request is fully funded!`);
      console.log(`🎉 Ready for NFT minting.`);
    } else {
      console.log(`❌ NOT FUNDED: Additional funding required`);
      console.log(`💡 Missing: ${remainingAmount / LAMPORTS_PER_SOL} SOL`);
      console.log(
        `📈 Progress: ${((depositAmount / priceEstimate) * 100).toFixed(2)}%`
      );
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Rust関数を実際に呼び出してチェック（デモンストレーション用）
    try {
      const fundedResult = await program.methods
        .isPurchaseRequestFunded()
        .accounts({
          purchaseRequest: purchaseRequestPda,
        })
        .view();

      console.log(
        `\n🔧 Rust Function Result: ${fundedResult ? "FUNDED" : "NOT FUNDED"}`
      );
    } catch (viewError) {
      console.log(
        `\n⚠️ Could not call Rust view function (this is normal for some RPC endpoints)`
      );
    }

    // 終了コード設定（スクリプト連携用）
    process.exit(isFunded ? 0 : 1);
  } catch (error) {
    if (error.message.includes("Account does not exist")) {
      console.error(
        `❌ Purchase request "${requestId}" not found for owner ${owner.toString()}`
      );
      console.log(`💡 Make sure the request ID and owner address are correct.`);
    } else {
      console.error("❌ Error:", error);
    }
    process.exit(2); // エラー時の終了コード
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(2);
});

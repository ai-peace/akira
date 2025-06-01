import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { factoryProgramMethods } from "../common/program-methods";
import { scriptConsts } from "../consts/scriptConsts";

async function main() {
  const requestId = process.argv[2];
  const ownerAddress = process.argv[3]; // オプション: 特定のオーナーアドレス

  if (!requestId) {
    console.error("❌ Request ID is required");
    console.log(
      "Usage: pnpm tsx scripts/02_deposit/03_get_purchase_request_by_id.ts <request_id> [owner_address]"
    );
    console.log(
      "Example: pnpm tsx scripts/02_deposit/03_get_purchase_request_by_id.ts my-request-123"
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
    console.log(`🔍 Fetching purchase request: ${requestId}`);
    console.log(`👤 Owner: ${owner.toString()}`);
    console.log(`📍 PDA Address: ${purchaseRequestPda.toString()}`);

    // Purchase Requestデータを取得
    // @ts-ignore
    const purchaseRequest = await program.account.purchaseRequest.fetch(
      purchaseRequestPda
    );

    console.log(`\n📋 Purchase Request Details:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🆔 Request ID: ${purchaseRequest.requestId}`);
    console.log(`👤 Owner: ${purchaseRequest.owner.toString()}`);
    console.log(`🌐 Metadata URI: ${purchaseRequest.metadataUri}`);
    console.log(
      `💰 Price Estimate: ${
        purchaseRequest.priceEstimate.toNumber() / LAMPORTS_PER_SOL
      } SOL`
    );
    console.log(`📊 Status: ${Object.keys(purchaseRequest.status)[0]}`);
    console.log(
      `💳 Deposited Amount: ${
        purchaseRequest.depositAmount.toNumber() / LAMPORTS_PER_SOL
      } SOL`
    );

    if (purchaseRequest.rwaMint) {
      console.log(`🎨 RWA Mint: ${purchaseRequest.rwaMint.toString()}`);
    } else {
      console.log(`🎨 RWA Mint: Not yet minted`);
    }

    if (purchaseRequest.purchaseConfirmation) {
      console.log(
        `✅ Purchase Confirmation: ${purchaseRequest.purchaseConfirmation}`
      );
    }

    if (purchaseRequest.storageId) {
      console.log(`📦 Storage ID: ${purchaseRequest.storageId}`);
    }

    console.log(
      `⏰ Created At: ${new Date(
        purchaseRequest.timestamp.toNumber() * 1000
      ).toISOString()}`
    );
    console.log(
      `🔑 Admin Authority: ${purchaseRequest.adminAuthority.toString()}`
    );

    if (purchaseRequest.cancellationReason) {
      console.log(
        `❌ Cancellation Reason: ${purchaseRequest.cancellationReason}`
      );
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 資金状況の分析
    const isFunded =
      purchaseRequest.depositAmount.toNumber() >=
      purchaseRequest.priceEstimate.toNumber();
    const remainingAmount =
      purchaseRequest.priceEstimate.toNumber() -
      purchaseRequest.depositAmount.toNumber();

    console.log(`\n💡 Funding Analysis:`);
    if (isFunded) {
      console.log(`✅ Fully funded! Ready for minting.`);
    } else {
      console.log(
        `⚠️ Needs ${
          remainingAmount / LAMPORTS_PER_SOL
        } SOL more to be fully funded.`
      );
    }
  } catch (error) {
    if (error.message.includes("Account does not exist")) {
      console.error(
        `❌ Purchase request "${requestId}" not found for owner ${owner.toString()}`
      );
      console.log(`💡 Make sure the request ID and owner address are correct.`);
    } else {
      console.error("❌ Error:", error);
    }
  }
}

main().catch(console.error);

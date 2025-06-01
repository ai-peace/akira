import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { factoryProgramMethods } from "../common/program-methods";
import { scriptConsts } from "../consts/scriptConsts";
import { scriptProperties } from "../consts/scriptProperties";

async function main() {
  const ownerAddress = process.argv[2];
  const requestId = process.argv[3];

  if (!ownerAddress || !requestId) {
    console.error("❌ All parameters are required");
    console.log(
      "Usage: pnpm tsx scripts/02_deposit/05_find_purchase_request.ts <owner_address> <request_id>"
    );
    console.log(
      "Example: pnpm tsx scripts/02_deposit/05_find_purchase_request.ts kLVTJRLJPif8QexEZZiobhyLXA9Gqvhziv7DXdVuNgE test-request-001"
    );
    process.exit(1);
  }

  const { program, wallet } = factoryProgramMethods();

  console.log(`🔍 Finding Purchase Request PDA:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`👤 Owner Address: ${ownerAddress}`);
  console.log(`🆔 Request ID: ${requestId}`);
  console.log(`🔧 Current User: ${wallet.publicKey.toString()}`);

  try {
    const ownerPubkey = new PublicKey(ownerAddress);

    // 手動でPDA計算（比較用）
    const [manualPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("purchase_request"),
        ownerPubkey.toBuffer(),
        Buffer.from(requestId),
      ],
      scriptConsts.PROGRAM_ID
    );

    console.log(`\n📍 Manual PDA Calculation:`);
    console.log(`🔒 Purchase Request PDA: ${manualPda.toString()}`);

    // プログラムのfind_purchase_request機能を呼び出し
    console.log(`\n🚀 Calling program find_purchase_request...`);

    const foundPda = await program.methods
      .findPurchaseRequest(ownerPubkey, requestId)
      .accounts({
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .view();

    console.log(`\n✅ Purchase Request PDA found!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔒 Found PDA: ${foundPda.toString()}`);
    console.log(`🔧 Manual PDA: ${manualPda.toString()}`);
    console.log(
      `✨ PDA Match: ${
        foundPda.toString() === manualPda.toString() ? "✅ Yes" : "❌ No"
      }`
    );

    // PDAアカウントの存在確認
    try {
      // @ts-ignore
      const purchaseRequest = await program.account.purchaseRequest.fetch(
        foundPda
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
    } catch (fetchError) {
      console.log(`\n⚠️ Account Status:`);
      console.log(`• PDA Calculated Successfully: ✅`);
      console.log(`• Account Exists: ❌ (Not yet created)`);
      console.log(`• This means the purchase request hasn't been created yet`);
    }

    console.log(`\n🔍 Solana Explorer Links:`);
    console.log(
      `• PDA Account: https://explorer.solana.com/address/${foundPda.toString()}?cluster=${
        scriptProperties.solanaNetwork
      }`
    );
    console.log(
      `• Owner Account: https://explorer.solana.com/address/${ownerAddress}?cluster=${scriptProperties.solanaNetwork}`
    );

    console.log(`\n💡 PDA Information:`);
    console.log(
      `• Seeds: ["purchase_request", owner.as_ref(), request_id.as_bytes()]`
    );
    console.log(`• Program ID: ${scriptConsts.PROGRAM_ID.toString()}`);
    console.log(
      `• This PDA can be used to create or interact with the purchase request`
    );
  } catch (error) {
    console.error("❌ Error:", error);

    if (error.toString().includes("Invalid public key")) {
      console.error(
        "💡 Make sure the owner address is a valid Solana public key"
      );
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

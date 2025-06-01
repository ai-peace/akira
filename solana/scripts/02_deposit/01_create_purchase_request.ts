import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { factoryProgramMethods } from "../common/program-methods";
import { scriptConsts } from "../consts/scriptConsts";

async function main() {
  const requestId = process.argv[2];
  const priceEstimate = process.argv[3]
    ? parseFloat(process.argv[3]) * LAMPORTS_PER_SOL
    : Math.floor(0.1 * LAMPORTS_PER_SOL);
  const metadataUri =
    process.argv[4] ||
    "https://hanzochang-sandbox.s3.ap-northeast-1.amazonaws.com/akira/collection_metadata.json";

  if (!requestId) {
    console.error("❌ Request ID is required");
    console.log(
      "Usage: pnpm tsx scripts/02_deposit/01_create_purchase_request.ts <request_id> <price_estimate> <metadata_uri>"
    );
    process.exit(1);
  }

  const { program, wallet, keypair } = factoryProgramMethods();

  const [purchaseRequestPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("purchase_request"),
      wallet.publicKey.toBuffer(),
      Buffer.from(requestId),
    ],
    scriptConsts.PROGRAM_ID
  );

  try {
    console.log(`🚀 Creating purchase request: ${requestId}`);
    console.log(`💰 Price Estimate: ${priceEstimate / LAMPORTS_PER_SOL} SOL`);
    console.log(`📍 PDA Address: ${purchaseRequestPda.toString()}`);

    const tx = await program.methods
      .createPurchaseRequest(
        requestId,
        metadataUri,
        new anchor.BN(priceEstimate)
      )
      .accounts({
        purchaseRequest: purchaseRequestPda,
        user: wallet.publicKey,
        adminAuthority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();

    console.log(
      `✅ Purchase Request Created: ${purchaseRequestPda.toString()}`
    );
    console.log(
      `📝 Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

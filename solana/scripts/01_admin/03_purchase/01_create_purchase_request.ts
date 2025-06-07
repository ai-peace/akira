import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { factoryProgramMethods, factoryPda } from "../../common/program-methods";
import { scriptConsts } from "../../consts/scriptConsts";

// 定数定義
const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"); // Devnet USDT
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC

async function main() {
  const targetUser = process.argv[2];
  const requestId = process.argv[3];
  const priceEstimate = process.argv[4]
    ? parseFloat(process.argv[4]) * LAMPORTS_PER_SOL
    : Math.floor(0.1 * LAMPORTS_PER_SOL);
  const metadataUri =
    process.argv[5] ||
    "https://hanzochang-sandbox.s3.ap-northeast-1.amazonaws.com/akira/collection_metadata.json";
  const depositTokenType = process.argv[6] || "sol"; // Default to SOL

  if (!targetUser || !requestId) {
    console.error("❌ Target user and Request ID are required");
    console.log(
      "Usage: pnpm tsx scripts/02_deposit/01_create_purchase_request.ts <target_user_pubkey> <request_id> <price_estimate> <metadata_uri> <deposit_token_type>"
    );
    console.log(
      "Example: pnpm tsx scripts/02_deposit/01_create_purchase_request.ts kLVTJRLJPif8QexEZZiobhyLXA9Gqvhziv7DXdVuNgE my-request-123 0.5 https://example.com/metadata.json sol"
    );
    console.log("Note: deposit_token_type can be 'sol', 'usdt', or 'usdc'");
    console.log("Note: Only admin can create purchase requests");
    process.exit(1);
  }

  let targetUserPubkey: PublicKey;
  try {
    targetUserPubkey = new PublicKey(targetUser);
  } catch (error) {
    console.error("❌ Invalid target user public key");
    process.exit(1);
  }

  // デポジットトークンタイプを解析
  let depositTokenEnum: any;
  let depositTokenMint: PublicKey | null = null;

  switch (depositTokenType.toLowerCase()) {
    case "sol":
      depositTokenEnum = { sol: {} };
      break;
    case "usdt":
      depositTokenEnum = { usdt: {} };
      depositTokenMint = USDT_MINT;
      break;
    case "usdc":
      depositTokenEnum = { usdc: {} };
      depositTokenMint = USDC_MINT;
      break;
    default:
      console.error(
        "❌ Invalid deposit token type. Must be 'sol', 'usdt', or 'usdc'"
      );
      process.exit(1);
  }

  const { program, wallet, keypair } = factoryProgramMethods();

  const [purchaseRequestPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("purchase_request"),
      targetUserPubkey.toBuffer(),
      Buffer.from(requestId),
    ],
    scriptConsts.PROGRAM_ID
  );

  // Global Config PDA計算
  const globalConfigPda = factoryPda(
    [Buffer.from("config")],
    scriptConsts.PROGRAM_ID
  );

  try {
    console.log(`🚀 Admin creating purchase request: ${requestId}`);
    console.log(`👤 Target User: ${targetUserPubkey.toString()}`);
    console.log(
      `💰 Price Estimate: ${
        priceEstimate / LAMPORTS_PER_SOL
      } ${depositTokenType.toUpperCase()}`
    );
    console.log(`🪙 Deposit Token Type: ${depositTokenType.toUpperCase()}`);
    if (depositTokenMint) {
      console.log(`🏦 Token Mint: ${depositTokenMint.toString()}`);
    }
    console.log(`📍 PDA Address: ${purchaseRequestPda.toString()}`);
    console.log(`🔑 Admin: ${wallet.publicKey.toString()}`);

    const tx = await program.methods
      .createPurchaseRequest(
        targetUserPubkey,
        requestId,
        metadataUri,
        new anchor.BN(priceEstimate),
        depositTokenEnum,
        depositTokenMint
      )
      .accounts({
        purchaseRequest: purchaseRequestPda,
        globalConfig: globalConfigPda,
        admin: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([keypair])
      .rpc();

    console.log(
      `✅ Purchase Request Created: ${purchaseRequestPda.toString()}`
    );
    console.log(
      `📝 Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );

    console.log(`\n💡 Next steps:`);
    console.log(
      `1. User (${targetUserPubkey.toString()}) can now deposit ${depositTokenType.toUpperCase()} using:`
    );
    console.log(
      `   pnpm tsx scripts/02_deposit/02_deposit_funds.ts ${requestId}`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

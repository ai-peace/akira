import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { factoryProgramMethods, factoryPda } from "../common/program-methods";
import { scriptConsts } from "../consts/scriptConsts";

async function main() {
  const requestId = process.argv[2];
  const depositAmount = process.argv[3]
    ? parseFloat(process.argv[3]) * LAMPORTS_PER_SOL
    : 0.1 * LAMPORTS_PER_SOL; // デフォルト0.1 SOL

  if (!requestId) {
    console.error("❌ Request ID is required");
    console.log(
      "Usage: pnpm tsx scripts/02_deposit/02_deposit_funds.ts <request_id> [amount_in_sol]"
    );
    console.log(
      "Example: pnpm tsx scripts/02_deposit/02_deposit_funds.ts my-request-123 0.5"
    );
    process.exit(1);
  }

  const { program, wallet, keypair } = factoryProgramMethods();

  // Purchase Request PDA計算
  const [purchaseRequestPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("purchase_request"),
      wallet.publicKey.toBuffer(),
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
    console.log(`🚀 Depositing funds to request: ${requestId}`);
    console.log(`💰 Amount: ${depositAmount / LAMPORTS_PER_SOL} SOL`);
    console.log(`📍 Purchase Request PDA: ${purchaseRequestPda.toString()}`);

    // Global Configからdeposit_targetを取得
    // @ts-ignore
    const globalConfig = await program.account.globalConfig.fetch(
      globalConfigPda
    );
    console.log(`🏦 Deposit Target: ${globalConfig.depositTarget.toString()}`);

    const tx = await program.methods
      .depositFunds(new anchor.BN(depositAmount))
      .accounts({
        purchaseRequest: purchaseRequestPda,
        owner: wallet.publicKey,
        globalConfig: globalConfigPda,
        depositAccount: globalConfig.depositTarget,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();

    console.log(`✅ Funds deposited successfully!`);
    console.log(
      `📝 Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );

    // 更新後の状態を確認
    // @ts-ignore
    const updatedRequest = await program.account.purchaseRequest.fetch(
      purchaseRequestPda
    );
    console.log(`\n📊 Updated Purchase Request Status:`);
    console.log(
      `• Total Deposited: ${
        updatedRequest.depositAmount.toNumber() / LAMPORTS_PER_SOL
      } SOL`
    );
    console.log(
      `• Price Estimate: ${
        updatedRequest.priceEstimate.toNumber() / LAMPORTS_PER_SOL
      } SOL`
    );
    console.log(`• Status: ${Object.keys(updatedRequest.status)[0]}`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);

import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { factoryProgramMethods } from "../../common/program-methods";
import { scriptConsts } from "../../consts/scriptConsts";
import { scriptProperties } from "../../consts/scriptProperties";

// Master Edition PDA計算
function findMasterEditionAccount(mint: PublicKey): [PublicKey, number] {
  const METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    METADATA_PROGRAM_ID
  );
}

async function main() {
  const nftMint = process.argv[2];
  const reason = process.argv[3];

  if (!nftMint || !reason) {
    console.error("❌ All parameters are required");
    console.log(
      'Usage: pnpm tsx scripts/01_admin/07_admin_lock_nft.ts <nft_mint> "<reason>"'
    );
    console.log(
      'Example: pnpm tsx scripts/01_admin/07_admin_lock_nft.ts 2b78N1xiTA8cC5us7gTaebscBnHboRfJrb1AeXiB9N6A "Emergency asset verification required"'
    );
    process.exit(1);
  }

  const { program, wallet, keypair: adminKeypair } = factoryProgramMethods();

  console.log(`🚨 Admin Emergency Lock NFT:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🎨 NFT Mint: ${nftMint}`);
  console.log(`📝 Reason: ${reason}`);
  console.log(`👨‍💼 Global Admin: ${wallet.publicKey.toString()}`);

  try {
    const nftMintPubkey = new PublicKey(nftMint);

    // Global Config PDA計算
    const [globalConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      scriptConsts.PROGRAM_ID
    );

    // RWA State PDA計算
    const [rwaStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("rwa_state"), nftMintPubkey.toBuffer()],
      scriptConsts.PROGRAM_ID
    );

    // 現在のRWA Stateを取得してオーナーを確認
    // @ts-ignore
    const rwaStateAccount = await program.account.rwaState.fetch(rwaStatePda);
    const currentOwner = rwaStateAccount.owner;

    // Token Account計算
    const tokenAccount = getAssociatedTokenAddressSync(
      nftMintPubkey,
      currentOwner
    );

    // Master Edition PDA
    const [masterEditionPda] = findMasterEditionAccount(nftMintPubkey);

    console.log(`\n📍 Account Information:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`⚙️ Global Config PDA: ${globalConfigPda.toString()}`);
    console.log(`🔒 RWA State PDA: ${rwaStatePda.toString()}`);
    console.log(`👤 Current Owner: ${currentOwner.toString()}`);
    console.log(`🏪 Token Account: ${tokenAccount.toString()}`);
    console.log(`👑 Master Edition: ${masterEditionPda.toString()}`);
    console.log(
      `📊 Current State: ${
        rwaStateAccount.isExchangeable ? "Exchangeable" : "Not Exchangeable"
      }`
    );

    console.log(`\n🚀 Submitting admin lock transaction...`);

    const tx = await program.methods
      .adminLockNft(reason)
      .accounts({
        rwaState: rwaStatePda,
        globalConfig: globalConfigPda,
        admin: wallet.publicKey,
        tokenAccount: tokenAccount,
        mint: nftMintPubkey,
        masterEdition: masterEditionPda,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .signers([adminKeypair])
      .rpc();

    console.log(`\n✅ NFT locked by admin successfully!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎨 NFT Mint: ${nftMint}`);
    console.log(`🔒 Status: Emergency Locked`);
    console.log(`📝 Reason: ${reason}`);
    console.log(`⏰ Lock Time: ${new Date().toISOString()}`);
    console.log(`👨‍💼 Locked by: Global Admin`);
    console.log(
      `📝 Transaction: https://explorer.solana.com/tx/${tx}?cluster=${scriptProperties.solanaNetwork}`
    );

    console.log(`\n🔍 Solana Explorer Links:`);
    console.log(
      `• Transaction: https://explorer.solana.com/tx/${tx}?cluster=${scriptProperties.solanaNetwork}`
    );
    console.log(
      `• NFT Mint: https://explorer.solana.com/address/${nftMint}?cluster=${scriptProperties.solanaNetwork}`
    );
    console.log(
      `• RWA State: https://explorer.solana.com/address/${rwaStatePda.toString()}?cluster=${
        scriptProperties.solanaNetwork
      }`
    );

    console.log(`\n🚨 Emergency Lock Information:`);
    console.log(`• This is an emergency administrative action`);
    console.log(`• Only Global Admin can perform this operation`);
    console.log(`• The NFT has been frozen due to: ${reason}`);
    console.log(`• Further investigation may be required`);

    // 更新された状態を確認
    // @ts-ignore
    const updatedRwaState = await program.account.rwaState.fetch(rwaStatePda);
    console.log(`\n📊 Updated State:`);
    console.log(`• Is Exchangeable: ${updatedRwaState.isExchangeable}`);
    if (updatedRwaState.exchangedAt) {
      console.log(
        `• Locked At: ${new Date(
          updatedRwaState.exchangedAt.toNumber() * 1000
        ).toISOString()}`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
    if (error.toString().includes("Unauthorized")) {
      console.error(
        "💡 Make sure you are running this script with Global Admin authority"
      );
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { factoryProgramMethods } from "../../common/program-methods";
import { scriptConsts } from "../../consts/scriptConsts";
import { scriptProperties } from "../../consts/scriptProperties";

async function main() {
  const nftMint = process.argv[2];
  const collectionSeed = process.argv[3];
  const newUri = process.argv[4];

  if (!nftMint || !collectionSeed || !newUri) {
    console.error("❌ All parameters are required");
    console.log(
      "Usage: pnpm tsx scripts/01_admin/08_update_rwa_uri.ts <nft_mint> <collection_seed> <new_uri>"
    );
    console.log(
      'Example: pnpm tsx scripts/01_admin/08_update_rwa_uri.ts 2b78N1xiTA8cC5us7gTaebscBnHboRfJrb1AeXiB9N6A akira-1122 "https://arweave.net/new-metadata-hash"'
    );
    process.exit(1);
  }

  const {
    program,
    wallet,
    keypair: authorityKeypair,
  } = factoryProgramMethods();

  console.log(`📝 Updating RWA NFT URI:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🎨 NFT Mint: ${nftMint}`);
  console.log(`🏛️ Collection Seed: ${collectionSeed}`);
  console.log(`🌐 New URI: ${newUri}`);
  console.log(`👤 Collection Authority: ${wallet.publicKey.toString()}`);

  try {
    const nftMintPubkey = new PublicKey(nftMint);

    // RWA State PDA計算
    const [rwaStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("rwa_state"), nftMintPubkey.toBuffer()],
      scriptConsts.PROGRAM_ID
    );

    // Collection Config PDA計算
    const [collectionConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection_config"), Buffer.from(collectionSeed)],
      scriptConsts.PROGRAM_ID
    );

    // 現在のRWA Stateを取得
    // @ts-ignore
    const rwaStateAccount = await program.account.rwaState.fetch(rwaStatePda);
    const currentUri = rwaStateAccount.uri;

    console.log(`\n📍 Account Information:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔒 RWA State PDA: ${rwaStatePda.toString()}`);
    console.log(`🏛️ Collection Config PDA: ${collectionConfigPda.toString()}`);
    console.log(`📄 Current URI: ${currentUri}`);
    console.log(`🆕 New URI: ${newUri}`);

    if (currentUri === newUri) {
      console.log(`\n⚠️ Warning: New URI is the same as current URI`);
      console.log(`Current URI: ${currentUri}`);
      console.log(`New URI: ${newUri}`);
      process.exit(0);
    }

    console.log(`\n🚀 Submitting URI update transaction...`);

    const tx = await program.methods
      .updateRwaUri(collectionSeed, newUri)
      .accountsStrict({
        rwaState: rwaStatePda,
        collectionConfig: collectionConfigPda,
        mint: nftMintPubkey,
        collectionAuthority: wallet.publicKey,
      })
      .signers([authorityKeypair])
      .rpc();

    console.log(`\n✅ RWA NFT URI updated successfully!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎨 NFT Mint: ${nftMint}`);
    console.log(`🏛️ Collection Seed: ${collectionSeed}`);
    console.log(`📄 Old URI: ${currentUri}`);
    console.log(`🆕 New URI: ${newUri}`);
    console.log(`👤 Updated by: Collection Authority`);
    console.log(`⏰ Update Time: ${new Date().toISOString()}`);
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

    console.log(`\n🎯 URI Update Information:`);
    console.log(`• Only Collection Authority can update RWA URI`);
    console.log(`• This represents metadata changes for the physical asset`);
    console.log(`• The new URI should point to valid metadata JSON`);
    console.log(`• URI changes are logged for audit purposes`);

    // 更新された状態を確認
    // @ts-ignore
    const updatedRwaState = await program.account.rwaState.fetch(rwaStatePda);
    console.log(`\n📊 Verification:`);
    console.log(`• Updated URI: ${updatedRwaState.uri}`);
    console.log(
      `• URI Update Successful: ${
        updatedRwaState.uri === newUri ? "✅ Yes" : "❌ No"
      }`
    );
  } catch (error) {
    console.error("❌ Error:", error);
    if (error.toString().includes("Unauthorized")) {
      console.error(
        "💡 Make sure you are running this script with Collection Authority"
      );
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

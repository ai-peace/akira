import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { factoryProgramMethods } from "../common/program-methods";
import { scriptConsts } from "../consts/scriptConsts";
import { scriptProperties } from "../consts/scriptProperties";

async function main() {
  const nftMint = process.argv[2];
  const collectionSeed = process.argv[3];

  if (!nftMint || !collectionSeed) {
    console.error("❌ All parameters are required");
    console.log(
      "Usage: pnpm tsx scripts/01_admin/06_exchange_nft.ts <nft_mint> <collection_seed>"
    );
    console.log(
      "Example: pnpm tsx scripts/01_admin/06_exchange_nft.ts 2b78N1xiTA8cC5us7gTaebscBnHboRfJrb1AeXiB9N6A akira-1122"
    );
    process.exit(1);
  }

  const {
    program,
    wallet,
    keypair: authorityKeypair,
  } = factoryProgramMethods();

  console.log(`🔄 Exchanging RWA NFT:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🎨 NFT Mint: ${nftMint}`);
  console.log(`🏛️ Collection Seed: ${collectionSeed}`);
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

    // RWA Stateから現在のオーナーを取得
    // @ts-ignore
    const rwaStateAccount = await program.account.rwaState.fetch(rwaStatePda);
    const currentOwner = rwaStateAccount.owner;

    // Token Account計算
    const tokenAccount = getAssociatedTokenAddressSync(
      nftMintPubkey,
      currentOwner
    );

    console.log(`\n📍 Account Information:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔒 RWA State PDA: ${rwaStatePda.toString()}`);
    console.log(`🏛️ Collection Config PDA: ${collectionConfigPda.toString()}`);
    console.log(`👤 Current Owner: ${currentOwner.toString()}`);
    console.log(`🏪 Token Account: ${tokenAccount.toString()}`);
    console.log(`📊 Is Exchangeable: ${rwaStateAccount.isExchangeable}`);

    // 交換可能性チェック
    if (!rwaStateAccount.isExchangeable) {
      console.error("❌ NFT is not exchangeable");
      process.exit(1);
    }

    console.log(`\n🚀 Submitting exchange transaction...`);

    const tx = await program.methods
      .exchangeNft()
      .accounts({
        rwaState: rwaStatePda,
        collectionConfig: collectionConfigPda,
        owner: currentOwner,
        collectionAuthority: wallet.publicKey,
        tokenAccount: tokenAccount,
        mint: nftMintPubkey,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .signers([authorityKeypair])
      .rpc();

    console.log(`\n✅ NFT exchanged and frozen successfully!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎨 NFT Mint: ${nftMint}`);
    console.log(`🔒 Status: Frozen and Not Exchangeable`);
    console.log(`⏰ Exchange Time: ${new Date().toISOString()}`);
    console.log(`🔑 Frozen by: Collection Authority`);
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

    console.log(`\n🏛️ Physical Asset Exchange:`);
    console.log(
      `• The NFT has been frozen to represent physical asset exchange`
    );
    console.log(`• Only Collection Authority can perform this operation`);
    console.log(`• This action is irreversible under current implementation`);

    // 更新された状態を確認
    // @ts-ignore
    const updatedRwaState = await program.account.rwaState.fetch(rwaStatePda);
    console.log(`\n📊 Updated State:`);
    console.log(`• Is Exchangeable: ${updatedRwaState.isExchangeable}`);
    console.log(
      `• Exchanged At: ${new Date(
        updatedRwaState.exchangedAt.toNumber() * 1000
      ).toISOString()}`
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

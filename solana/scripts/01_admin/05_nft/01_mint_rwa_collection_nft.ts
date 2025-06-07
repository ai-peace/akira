import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { factoryProgramMethods, factoryPda } from "../../common/program-methods";
import { scriptConsts } from "../../consts/scriptConsts";
import { scriptProperties } from "../../consts/scriptProperties";
import * as fs from "fs";
import * as path from "path";

// 設定ファイルの型定義
interface MintConfig {
  requestId: string;
  collectionSeed: string;
  nftName: string;
  nftSymbol: string;
  nftUri: string;
  description?: string;
}

// Helper functions for PDA calculation
function findMetadataAccount(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBytes(),
      mint.toBytes(),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
  );
}

function findMasterEditionAccount(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBytes(),
      mint.toBytes(),
      Buffer.from("edition"),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
  );
}

// 設定ファイルを読み込む関数
function loadMintConfig(configPath?: string): MintConfig {
  const defaultConfigPath = path.join(
    process.cwd(),
    "scripts/seed/mint_rwa_collection_nft.json"
  );

  const filePath = configPath || defaultConfigPath;

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Config file not found: ${filePath}`);
    console.log(`📝 Please create a config file at: ${filePath}`);
    console.log(`📋 Example config file structure:`);
    console.log(
      JSON.stringify(
        {
          requestId: "test-request-123",
          collectionSeed: "akira-1122",
          nftName: "My RWA NFT",
          nftSymbol: "MRWA",
          nftUri: "https://arweave.net/metadata-hash",
          description: "Description of your RWA NFT",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  try {
    const configData = fs.readFileSync(filePath, "utf8");
    const config: MintConfig = JSON.parse(configData);

    // 必須フィールドの検証
    const requiredFields = [
      "requestId",
      "collectionSeed",
      "nftName",
      "nftSymbol",
      "nftUri",
    ];
    const missingFields = requiredFields.filter(
      (field) => !config[field as keyof MintConfig]
    );

    if (missingFields.length > 0) {
      console.error(
        `❌ Missing required fields in config: ${missingFields.join(", ")}`
      );
      process.exit(1);
    }

    return config;
  } catch (error) {
    console.error(`❌ Error reading config file: ${error}`);
    process.exit(1);
  }
}

async function main() {
  // コマンドライン引数で設定ファイルパスを指定可能
  const configPath = process.argv[2];

  console.log(`🎨 Loading RWA Collection NFT Mint Configuration...`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (configPath) {
    console.log(`📁 Using custom config: ${configPath}`);
  } else {
    console.log(
      `📁 Using default config: scripts/seed/mint_rwa_collection_nft.json`
    );
  }

  // 設定ファイルから設定を読み込み
  const config = loadMintConfig(configPath);

  console.log(`\n🎨 Minting RWA Collection NFT (Authority → Target User):`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🆔 Request ID: ${config.requestId}`);
  console.log(`🏛️ Collection Seed: ${config.collectionSeed}`);
  console.log(`🎨 NFT Name: ${config.nftName}`);
  console.log(`🔤 NFT Symbol: ${config.nftSymbol}`);
  console.log(`🌐 NFT URI: ${config.nftUri}`);
  if (config.description) {
    console.log(`📝 Description: ${config.description}`);
  }

  const {
    program,
    wallet,
    keypair: authorityKeypair,
  } = factoryProgramMethods();
  console.log(`🔑 Authority (Executor): ${wallet.publicKey.toString()}`);

  // まずPurchase Requestからtarget_userを取得する必要がある
  // Purchase Request PDAを計算するため、まずはすべてのPDAを試す
  let purchaseRequestPda: PublicKey | null = null;
  let targetUser: PublicKey | null = null;

  // Global Config PDA計算
  const globalConfigPda = factoryPda(
    [Buffer.from("config")],
    scriptConsts.PROGRAM_ID
  );

  try {
    // Purchase Request PDAを探すため、まずはauthorityベースで試す
    const [tempPurchaseRequestPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("purchase_request"),
        wallet.publicKey.toBuffer(),
        Buffer.from(config.requestId),
      ],
      scriptConsts.PROGRAM_ID
    );

    // Purchase Requestを取得してtarget_userを確認
    // @ts-ignore
    const purchaseRequestData = await program.account.purchaseRequest.fetch(
      tempPurchaseRequestPda
    );

    purchaseRequestPda = tempPurchaseRequestPda;
    targetUser = purchaseRequestData.owner;

    console.log(`👤 Target User (NFT Recipient): ${targetUser.toString()}`);
    console.log(
      `💰 Request Status: ${Object.keys(purchaseRequestData.status)[0]}`
    );
    console.log(
      `💸 Deposited Amount: ${
        purchaseRequestData.depositAmount.toNumber() / 1e9
      } SOL`
    );
    console.log(
      `💲 Price Estimate: ${
        purchaseRequestData.priceEstimate.toNumber() / 1e9
      } SOL`
    );

    // 資金確認
    if (Object.keys(purchaseRequestData.status)[0] !== "funded") {
      console.error(
        `❌ Purchase request is not funded. Current status: ${
          Object.keys(purchaseRequestData.status)[0]
        }`
      );
      console.log(`💡 User needs to deposit funds first using:`);
      console.log(
        `   pnpm tsx scripts/02_deposit/02_deposit_funds.ts ${config.requestId}`
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(
      `❌ Could not find purchase request with authority as owner: ${error}`
    );
    console.log(
      `💡 Make sure the purchase request exists and was created by this authority`
    );
    process.exit(1);
  }

  if (!purchaseRequestPda || !targetUser) {
    console.error(`❌ Could not determine target user from purchase request`);
    process.exit(1);
  }

  // Collection Config PDA計算
  const [collectionConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_config"), Buffer.from(config.collectionSeed)],
    scriptConsts.PROGRAM_ID
  );

  // NFT Mint Keypair生成
  const nftMintKeypair = Keypair.generate();

  // RWA State PDA計算
  const [rwaStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("rwa_state"), nftMintKeypair.publicKey.toBuffer()],
    scriptConsts.PROGRAM_ID
  );

  // Token Account計算（target_user用）
  const tokenAccount = getAssociatedTokenAddressSync(
    nftMintKeypair.publicKey,
    targetUser // target_userのATA
  );

  // Metadata and Master Edition PDA計算
  const [metadataPda] = findMetadataAccount(nftMintKeypair.publicKey);
  const [masterEditionPda] = findMasterEditionAccount(nftMintKeypair.publicKey);

  console.log(`\n📍 Generated Addresses:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📍 Purchase Request PDA: ${purchaseRequestPda.toString()}`);
  console.log(`🏛️ Collection Config PDA: ${collectionConfigPda.toString()}`);
  console.log(`⚙️ Global Config PDA: ${globalConfigPda.toString()}`);
  console.log(`🎨 NFT Mint: ${nftMintKeypair.publicKey.toString()}`);
  console.log(`🔒 RWA State PDA: ${rwaStatePda.toString()}`);
  console.log(`🏪 Token Account (Target User): ${tokenAccount.toString()}`);
  console.log(`📄 Metadata PDA: ${metadataPda.toString()}`);
  console.log(`👑 Master Edition PDA: ${masterEditionPda.toString()}`);

  try {
    console.log(`\n🚀 Authority executing mint transaction...`);
    console.log(
      `⚡ NFT will be distributed to target user: ${targetUser.toString()}`
    );

    const tx = await program.methods
      .mintRwaCollectionNft(
        config.collectionSeed,
        config.nftName,
        config.nftSymbol,
        config.nftUri
      )
      .accounts({
        purchaseRequest: purchaseRequestPda,
        collectionConfig: collectionConfigPda,
        globalConfig: globalConfigPda,
        admin: wallet.publicKey,
        mint: nftMintKeypair.publicKey,
        rwaState: rwaStatePda,
        tokenAccount: tokenAccount,
        targetUser: targetUser,
        metadata: metadataPda,
        masterEdition: masterEditionPda,
        tokenMetadataProgram: new PublicKey(
          "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        ),
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .preInstructions([
        anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
          units: 400_000, // CU上限を40万に増加
        }),
      ])
      .signers([authorityKeypair, nftMintKeypair])
      .rpc();

    console.log(`\n✅ RWA Collection NFT minted successfully!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎨 NFT Mint: ${nftMintKeypair.publicKey.toString()}`);
    console.log(`👤 NFT Owner: ${targetUser.toString()}`);
    console.log(`🔒 RWA State: ${rwaStatePda.toString()}`);
    console.log(`🔑 Freeze Authority: Collection Authority (物理資産管理者)`);
    console.log(`⚡ Compute Units: Set to 400,000 (推定使用量 ~177,000)`);
    console.log(`💰 Additional Cost: ~1,000 lamports (~$0.0001 USD)`);
    console.log(
      `📝 Transaction: https://explorer.solana.com/tx/${tx}?cluster=${scriptProperties.solanaNetwork}`
    );

    console.log(`\n🔍 Solana Explorer Links:`);
    console.log(
      `• Transaction: https://explorer.solana.com/tx/${tx}?cluster=${scriptProperties.solanaNetwork}`
    );
    console.log(
      `• NFT Mint: https://explorer.solana.com/address/${nftMintKeypair.publicKey.toString()}?cluster=${
        scriptProperties.solanaNetwork
      }`
    );
    console.log(
      `• RWA State: https://explorer.solana.com/address/${rwaStatePda.toString()}?cluster=${
        scriptProperties.solanaNetwork
      }`
    );
    console.log(
      `• Target User Token Account: https://explorer.solana.com/address/${tokenAccount.toString()}?cluster=${
        scriptProperties.solanaNetwork
      }`
    );

    console.log(`\n🏛️ Physical Asset Management:`);
    console.log(
      `• Freeze Authority: Collection Authority manages physical assets`
    );
    console.log(
      `• Exchange Function: Collection Authority can freeze NFTs when physical assets are exchanged`
    );
    console.log(
      `• Admin Lock: Global admin can lock NFTs in emergency situations`
    );

    console.log(`\n💾 Config Used:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(JSON.stringify(config, null, 2));

    console.log(`\n🎯 Authority Flow Complete:`);
    console.log(`1. ✅ Authority executed mint transaction`);
    console.log(
      `2. ✅ NFT distributed to target user: ${targetUser.toString()}`
    );
    console.log(`3. ✅ Purchase request status updated to 'Completed'`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

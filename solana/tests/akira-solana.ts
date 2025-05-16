import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AkiraSolana } from "../target/types/akira_solana";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("akira-solana", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.AkiraSolana as Program<AkiraSolana>;
  const wallet = anchor.getProvider().wallet;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it("Create purchase request", async () => {
    // テストデータ
    const requestId = `request-${Math.floor(Math.random() * 1000000)}`;
    const metadataUri = "https://example.com/metadata.json";
    const priceEstimate = new anchor.BN(100000000); // 1 SOL in lamports

    // 管理者のキー
    const adminAuthority = wallet.publicKey;

    // PDAアドレスを取得
    const [purchaseRequestPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("purchase_request"),
        wallet.publicKey.toBuffer(),
        Buffer.from(requestId),
      ],
      program.programId
    );

    // トランザクション実行
    const tx = await program.methods
      .createPurchaseRequest(requestId, metadataUri, priceEstimate)
      .accounts({
        purchaseRequest: purchaseRequestPda,
        user: wallet.publicKey,
        adminAuthority: adminAuthority,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    console.log("Purchase request created! Transaction signature:", tx);

    // アカウントデータを取得して検証
    const accountData = await program.account.purchaseRequest.fetch(
      purchaseRequestPda
    );

    console.log("アカウントデータ:", accountData);
    expect(accountData.requestId).to.equal(requestId);
    expect(accountData.metadataUri).to.equal(metadataUri);
    expect(accountData.priceEstimate.toString()).to.equal(
      priceEstimate.toString()
    );
    expect(accountData.status.created).to.exist;
    expect(accountData.owner.toString()).to.equal(wallet.publicKey.toString());
  });
});

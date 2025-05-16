import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";

// プログラムID
const PROGRAM_ID = new PublicKey(
  "7imdRzjtg5ao34crVKZSfudYiaZtFXa4Y65tFGQWQETg"
);

/**
 * 改良版Solanaクライアント - 固定送付先機能付き
 */
export class PurchaseClient {
  private connection: Connection;
  private program: Program;
  private wallet: anchor.Wallet;

  constructor(connection: Connection, wallet: anchor.Wallet) {
    this.connection = connection;
    this.wallet = wallet;

    // プロバイダーを設定
    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    anchor.setProvider(provider);

    // IDLからプログラムを取得
    const idl = JSON.parse(
      fs.readFileSync("./target/idl/akira_solana.json", "utf-8")
    );
    this.program = new anchor.Program(idl, PROGRAM_ID, provider);
  }

  /**
   * グローバル設定アカウントのPDAを取得
   */
  getConfigPda(): PublicKey {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      this.program.programId
    );
    return configPda;
  }

  /**
   * グローバル設定を初期化（管理者のみ）
   */
  async initializeConfig(depositTarget: PublicKey) {
    try {
      const configPda = this.getConfigPda();

      console.log("グローバル設定を初期化中...");
      console.log("設定PDA:", configPda.toString());
      console.log("送付先:", depositTarget.toString());

      // トランザクション実行
      const tx = await this.program.methods
        .initializeConfig(depositTarget)
        .accounts({
          globalConfig: configPda,
          admin: this.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("設定初期化成功:", tx);
      return {
        txSignature: tx,
        configPda: configPda.toString(),
      };
    } catch (error) {
      console.error("設定初期化エラー:", error);
      throw error;
    }
  }

  /**
   * 送付先を更新（管理者のみ）
   */
  async updateDepositTarget(newDepositTarget: PublicKey) {
    try {
      const configPda = this.getConfigPda();

      console.log("送付先を更新中...");
      console.log("新しい送付先:", newDepositTarget.toString());

      // トランザクション実行
      const tx = await this.program.methods
        .updateDepositTarget(newDepositTarget)
        .accounts({
          globalConfig: configPda,
          admin: this.wallet.publicKey,
        })
        .rpc();

      console.log("送付先更新成功:", tx);
      return {
        txSignature: tx,
        configPda: configPda.toString(),
      };
    } catch (error) {
      console.error("送付先更新エラー:", error);
      throw error;
    }
  }

  /**
   * グローバル設定を取得
   */
  async getConfig() {
    try {
      const configPda = this.getConfigPda();
      const config = await this.program.account.globalConfig.fetch(configPda);
      return {
        admin: config.admin.toString(),
        depositTarget: config.depositTarget.toString(),
      };
    } catch (error) {
      console.error("設定取得エラー:", error);
      throw error;
    }
  }

  /**
   * 購入リクエストを作成する
   */
  async createPurchaseRequest(
    requestId: string,
    metadataUri: string,
    priceEstimate: number
  ) {
    try {
      // BN形式に変換
      const priceBN = new anchor.BN(priceEstimate);

      // 管理者のキー
      const adminAuthority = this.wallet.publicKey;

      // PDAを計算
      const [purchaseRequestPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("purchase_request"),
          this.wallet.publicKey.toBuffer(),
          Buffer.from(requestId),
        ],
        this.program.programId
      );

      console.log("PDAを作成:", purchaseRequestPda.toString());

      // トランザクション実行
      const tx = await this.program.methods
        .createPurchaseRequest(requestId, metadataUri, priceBN)
        .accounts({
          purchaseRequest: purchaseRequestPda,
          user: this.wallet.publicKey,
          adminAuthority: adminAuthority,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("トランザクション成功:", tx);
      return {
        txSignature: tx,
        purchaseRequestPda: purchaseRequestPda.toString(),
      };
    } catch (error) {
      console.error("エラー:", error);
      throw error;
    }
  }

  /**
   * 資金を入金する
   */
  async depositFunds(purchaseRequestPda: PublicKey, amount: number) {
    try {
      // 現在の設定を取得
      const config = await this.getConfig();
      const depositTarget = new PublicKey(config.depositTarget);

      console.log("資金入金中...");
      console.log("リクエストPDA:", purchaseRequestPda.toString());
      console.log("送付先:", depositTarget.toString());
      console.log("金額:", amount, "lamports");

      // BN形式に変換
      const amountBN = new anchor.BN(amount);

      // トランザクション実行
      const tx = await this.program.methods
        .depositFunds(amountBN)
        .accounts({
          purchaseRequest: purchaseRequestPda,
          owner: this.wallet.publicKey,
          globalConfig: this.getConfigPda(),
          depositAccount: depositTarget,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("入金成功:", tx);
      return {
        txSignature: tx,
      };
    } catch (error) {
      console.error("入金エラー:", error);
      throw error;
    }
  }

  /**
   * 購入リクエストのデータを取得
   */
  async getPurchaseRequestData(pdaAddress: string | PublicKey) {
    try {
      // PublicKeyに変換
      const publicKey =
        typeof pdaAddress === "string" ? new PublicKey(pdaAddress) : pdaAddress;

      // まずRPC経由でアカウントが存在するか確認
      const accountInfo = await this.connection.getAccountInfo(publicKey);

      if (!accountInfo) {
        console.log(
          "アカウントが見つかりません。パブリックキー:",
          publicKey.toString()
        );
        return null;
      }

      console.log("アカウント情報:", {
        owner: accountInfo.owner.toString(),
        executable: accountInfo.executable,
        lamports: accountInfo.lamports,
        dataSize: accountInfo.data.length,
      });

      // アカウントのデータをデコード
      const data = await this.program.account.purchaseRequest.fetch(publicKey);

      return {
        owner: data.owner.toString(),
        requestId: data.requestId,
        metadataUri: data.metadataUri,
        priceEstimate: data.priceEstimate.toString(),
        status: Object.keys(data.status)[0],
        depositAmount: data.depositAmount.toString(),
        timestamp: data.timestamp,
        formattedDate: new Date(Number(data.timestamp) * 1000).toISOString(),
      };
    } catch (error) {
      console.error("データ取得エラー:", error);
      throw error;
    }
  }
}

// 実行用関数
async function main() {
  // 接続情報
  const connection = new anchor.web3.Connection("http://127.0.0.1:8899");

  // キーペア読み込み
  const keypairPath = process.env.HOME + "/.config/solana/id.json";
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  const wallet = new anchor.Wallet(keypair);

  console.log("ウォレットアドレス:", wallet.publicKey.toString());

  // クライアント初期化
  const client = new PurchaseClient(connection, wallet);

  try {
    // コマンドライン引数
    const command = process.argv[2] || "help";

    switch (command) {
      case "init-config": {
        // 引数から送付先アドレスを取得またはデフォルトで現在のウォレットを使用
        const targetAddress = process.argv[3]
          ? new PublicKey(process.argv[3])
          : wallet.publicKey;

        const result = await client.initializeConfig(targetAddress);
        console.log("設定結果:", result);
        break;
      }

      case "update-target": {
        if (!process.argv[3]) {
          console.error("新しい送付先PDAを指定してください");
          return;
        }
        const newTarget = new PublicKey(process.argv[3]);
        const result = await client.updateDepositTarget(newTarget);
        console.log("更新結果:", result);
        break;
      }

      case "get-config": {
        const config = await client.getConfig();
        console.log("現在の設定:", config);
        break;
      }

      case "create": {
        // 購入リクエストを作成
        const requestId =
          process.argv[3] || `request-${Math.floor(Math.random() * 1000000)}`;
        const metadataUri =
          process.argv[4] || "https://example.com/metadata.json";
        const price = parseInt(process.argv[5] || "100000000"); // デフォルト 0.1 SOL

        console.log("リクエスト作成:", {
          requestId,
          metadataUri,
          price,
        });

        const result = await client.createPurchaseRequest(
          requestId,
          metadataUri,
          price
        );

        console.log("作成結果:", result);
        break;
      }

      case "deposit": {
        if (!process.argv[3]) {
          console.error("リクエストPDAを指定してください");
          return;
        }

        const requestPda = new PublicKey(process.argv[3]);
        const amount = parseInt(process.argv[4] || "50000000"); // デフォルト 0.05 SOL

        const result = await client.depositFunds(requestPda, amount);
        console.log("入金結果:", result);
        break;
      }

      case "info": {
        if (!process.argv[3]) {
          console.error("リクエストPDAを指定してください");
          return;
        }

        const data = await client.getPurchaseRequestData(process.argv[3]);
        console.log("リクエスト情報:", data);
        break;
      }

      case "help":
      default:
        console.log(`
使用方法:
  pnpm ts-node new-scripts/purchase-client.ts <コマンド> [引数...]

コマンド:
  init-config [送付先PDA]  - グローバル設定を初期化（省略時は現在のウォレット）
  update-target <送付先PDA> - 送付先を更新
  get-config                   - 現在の設定を表示
  create [ID] [URI] [価格]      - 購入リクエストを作成
  deposit <PDA> [金額]      - リクエストに資金を入金
  info <PDA>               - リクエスト情報を表示
  help                         - このヘルプを表示
`);
    }
  } catch (error) {
    console.error("実行エラー:", error);
  }
}

// 直接実行時のみmain関数を呼び出し
if (require.main === module) {
  main();
}

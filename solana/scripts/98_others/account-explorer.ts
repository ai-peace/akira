import { Connection, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AkiraSolana } from "../target/types/akira_solana";

// 主要な定数
const PROGRAM_ID = "7imdRzjtg5ao34crVKZSfudYiaZtFXa4Y65tFGQWQETg";
const RPC_URL = "http://127.0.0.1:8899";
const PREFIX = "purchase_request";

// 単純なバイナリパーサ（Anchorデコーダーが利用できない場合のバックアップ）
function parseStruct(buffer: Buffer): any {
  try {
    // 最初の8バイトはAnchorのディスクリミネータ
    const discriminator = buffer.slice(0, 8).toString("hex");

    // 次の32バイトはオーナーPublicKey
    const ownerPubkey = new PublicKey(buffer.slice(8, 40));

    // リクエストIDの長さ（4バイト）
    const requestIdLength = buffer.readUInt32LE(40);
    const requestIdEnd = 44 + requestIdLength;
    const requestId = buffer.slice(44, requestIdEnd).toString("utf8");

    // メタデータURIの長さ
    const uriLengthOffset = requestIdEnd;
    const uriLength = buffer.readUInt32LE(uriLengthOffset);
    const uriEnd = uriLengthOffset + 4 + uriLength;
    const metadataUri = buffer
      .slice(uriLengthOffset + 4, uriEnd)
      .toString("utf8");

    // 価格
    const priceOffset = uriEnd;
    const price = buffer.readBigUInt64LE(priceOffset);

    // ステータス
    const statusOffset = priceOffset + 8;
    const status = buffer[statusOffset];
    const statusMap = [
      "Created",
      "Funded",
      "Completed",
      "Redeemed",
      "Cancelled",
    ];

    // タイムスタンプ（8バイト後）
    const timestampOffset = statusOffset + 1 + 8 + 32 + 8; // status + depositAmount + rwa_mint + 他のoptionバイト
    const timestamp = buffer.readBigInt64LE(timestampOffset);

    return {
      discriminator,
      owner: ownerPubkey.toString(),
      requestId,
      metadataUri,
      priceEstimate: price.toString(),
      status: statusMap[status] || `Unknown(${status})`,
      timestamp: Number(timestamp),
      date: new Date(Number(timestamp) * 1000).toISOString(),
    };
  } catch (error) {
    return { error: "パースエラー", details: error.message };
  }
}

/**
 * Anchorを使用してプログラムインスタンスを初期化
 */
function initializeProgram() {
  try {
    const connection = new Connection(RPC_URL, "confirmed");

    // 読み取り専用ウォレット
    const wallet = new anchor.Wallet(anchor.web3.Keypair.generate());

    // プロバイダー設定
    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    anchor.setProvider(provider);

    // IDLを読み込み
    const idl = JSON.parse(
      fs.readFileSync("./target/idl/akira_solana.json", "utf-8")
    );

    // プログラムインスタンスを返却
    return {
      program: new anchor.Program(
        idl,
        PROGRAM_ID,
        provider
      ) as Program<AkiraSolana>,
      connection,
    };
  } catch (error) {
    console.error("プログラム初期化エラー:", error);
    // バックアップとして接続のみ返す
    return {
      program: null,
      connection: new Connection(RPC_URL, "confirmed"),
    };
  }
}

/**
 * グローバル設定アカウントを取得
 */
async function getGlobalConfig() {
  const { program, connection } = initializeProgram();

  if (!program) {
    console.log("Anchorプログラムが初期化できませんでした");
    return null;
  }

  try {
    // 設定アカウントのPDAを取得
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      new PublicKey(PROGRAM_ID)
    );

    console.log("設定アカウントPDA:", configPda.toString());

    // アカウント情報をチェック
    const accountInfo = await connection.getAccountInfo(configPda);
    if (!accountInfo) {
      console.log("設定アカウントが見つかりません。初期化が必要です。");
      return null;
    }

    // アカウントデータを取得
    try {
      const config = await program.account.globalConfig.fetch(configPda);
      return {
        pda: configPda.toString(),
        admin: config.admin.toString(),
        depositTarget: config.depositTarget.toString(),
      };
    } catch (error) {
      console.error("設定アカウントのデコードエラー:", error);
      return {
        pda: configPda.toString(),
        error: "デコードできませんでした",
      };
    }
  } catch (error) {
    console.error("設定取得エラー:", error);
    return null;
  }
}

/**
 * プログラムが所有するすべてのアカウントを取得
 */
async function getAllProgramAccounts() {
  const { program, connection } = initializeProgram();
  const pubkey = new PublicKey(PROGRAM_ID);

  try {
    console.log(`プログラム ${PROGRAM_ID} のアカウントを取得中...`);

    // すべてのプログラムアカウントを取得
    const accounts = await connection.getProgramAccounts(pubkey);
    console.log(`${accounts.length}件のアカウントが見つかりました\n`);

    // 結果を格納する配列
    const results = [];

    // 各アカウントを処理
    for (const { pubkey, account } of accounts) {
      const address = pubkey.toString();

      try {
        // Anchorデコードを試みる
        if (program) {
          try {
            // 設定アカウントの場合
            if (
              account.data.slice(0, 8).toString("hex") ===
              "config_discriminator"
            ) {
              const config = await program.account.globalConfig.fetch(pubkey);
              results.push({
                address,
                type: "GlobalConfig",
                data: {
                  admin: config.admin.toString(),
                  depositTarget: config.depositTarget.toString(),
                },
              });
              continue;
            }

            // 購入リクエストの場合
            const purchaseRequest = await program.account.purchaseRequest.fetch(
              pubkey
            );
            results.push({
              address,
              type: "PurchaseRequest",
              lamports: account.lamports,
              space: account.data.length,
              data: {
                owner: purchaseRequest.owner.toString(),
                requestId: purchaseRequest.requestId,
                metadataUri: purchaseRequest.metadataUri,
                priceEstimate: purchaseRequest.priceEstimate.toString(),
                status: Object.keys(purchaseRequest.status)[0],
                depositAmount: purchaseRequest.depositAmount.toString(),
                timestamp: Number(purchaseRequest.timestamp),
                date: new Date(
                  Number(purchaseRequest.timestamp) * 1000
                ).toISOString(),
              },
            });
            continue;
          } catch (error) {
            // Anchorデコードに失敗した場合はバイナリパースを試みる
          }
        }

        // バックアップとしてバイナリパース
        const parsedData = parseStruct(account.data);
        results.push({
          address,
          type: "Unknown",
          lamports: account.lamports,
          space: account.data.length,
          data: parsedData,
        });
      } catch (error) {
        results.push({
          address,
          type: "Error",
          lamports: account.lamports,
          space: account.data.length,
          error: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("アカウント取得エラー:", error);
    return [];
  }
}

/**
 * 特定のウォレットの購入リクエストを検索
 */
async function findPurchaseRequestsByWallet(walletAddress: string) {
  const { program, connection } = initializeProgram();
  const programId = new PublicKey(PROGRAM_ID);
  const walletPubkey = new PublicKey(walletAddress);

  // バッファの検索のためのフィルタを設定
  const filters = [
    {
      memcmp: {
        offset: 8, // ディスクリミネータの後
        bytes: walletPubkey.toBase58(),
      },
    },
  ];

  try {
    // フィルタを使ってアカウントを検索
    const accounts = await connection.getProgramAccounts(programId, {
      filters,
    });

    console.log(
      `ウォレット ${walletAddress} の購入リクエスト: ${accounts.length}件`
    );

    // 結果を格納する配列
    const results = [];

    // 各アカウントを処理
    for (const { pubkey, account } of accounts) {
      const address = pubkey.toString();

      try {
        // Anchorデコードを試みる
        if (program) {
          try {
            const purchaseRequest = await program.account.purchaseRequest.fetch(
              pubkey
            );
            results.push({
              address,
              type: "PurchaseRequest",
              data: {
                owner: purchaseRequest.owner.toString(),
                requestId: purchaseRequest.requestId,
                metadataUri: purchaseRequest.metadataUri,
                priceEstimate: purchaseRequest.priceEstimate.toString(),
                status: Object.keys(purchaseRequest.status)[0],
                depositAmount: purchaseRequest.depositAmount.toString(),
                timestamp: Number(purchaseRequest.timestamp),
                date: new Date(
                  Number(purchaseRequest.timestamp) * 1000
                ).toISOString(),
              },
            });
            continue;
          } catch (error) {
            // Anchorデコードに失敗した場合はバイナリパースを試みる
          }
        }

        // バックアップとしてバイナリパース
        const parsedData = parseStruct(account.data);
        results.push({
          address,
          type: "Unknown",
          data: parsedData,
        });
      } catch (error) {
        results.push({
          address,
          type: "Error",
          error: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error(`ウォレット ${walletAddress} の処理中にエラー:`, error);
    return [];
  }
}

// メイン関数
async function main() {
  // コマンドライン引数
  const command = process.argv[2] || "help";

  switch (command) {
    case "config": {
      // グローバル設定を表示
      const config = await getGlobalConfig();
      if (config) {
        console.log("\n=== グローバル設定 ===");
        console.log(`PDA: ${config.pda}`);
        console.log(`管理者: ${config.admin}`);
        console.log(`送付先: ${config.depositTarget}`);
      } else {
        console.log("\nグローバル設定が見つかりません。");
      }
      break;
    }

    case "all": {
      // すべてのプログラムアカウントを表示
      const accounts = await getAllProgramAccounts();

      accounts.forEach((account, index) => {
        console.log(`\n=== アカウント ${index + 1} [${account.type}] ===`);
        console.log(`PDA: ${account.address}`);

        if (account.type === "GlobalConfig") {
          console.log(`管理者: ${account.data.admin}`);
          console.log(`送付先: ${account.data.depositTarget}`);
        } else if (
          account.type === "PurchaseRequest" ||
          account.type === "Unknown"
        ) {
          if (account.lamports)
            console.log(`残高: ${account.lamports / 1e9} SOL`);
          if (account.space)
            console.log(`データサイズ: ${account.space} バイト`);

          if (account.data) {
            if (account.data.requestId)
              console.log(`リクエストID: ${account.data.requestId}`);
            if (account.data.owner)
              console.log(`オーナー: ${account.data.owner}`);
            if (account.data.metadataUri)
              console.log(`メタデータURI: ${account.data.metadataUri}`);
            if (account.data.priceEstimate)
              console.log(
                `価格見積もり: ${account.data.priceEstimate} lamports`
              );
            if (account.data.status)
              console.log(`ステータス: ${account.data.status}`);
            if (account.data.date)
              console.log(`作成日時: ${account.data.date}`);
          }
        } else if (account.type === "Error") {
          console.log(`エラー: ${account.error}`);
        }
      });

      // 結果をJSONファイルに保存
      fs.writeFileSync(
        "account-data.json",
        JSON.stringify({ accounts }, null, 2)
      );
      console.log("\nデータをaccount-data.jsonに保存しました");
      break;
    }

    case "wallet": {
      // 特定のウォレットのリクエストを表示
      const walletAddress = process.argv[3];
      if (!walletAddress) {
        console.error("ウォレットPDAを指定してください");
        console.log(
          "使用例: pnpm ts-node new-scripts/account-explorer.ts wallet <PDA>"
        );
        return;
      }

      const requests = await findPurchaseRequestsByWallet(walletAddress);

      requests.forEach((request, index) => {
        console.log(`\n=== 購入リクエスト ${index + 1} ===`);
        console.log(`PDA: ${request.address}`);

        if (request.type === "PurchaseRequest" || request.type === "Unknown") {
          if (request.data) {
            if (request.data.owner)
              console.log(`オーナー: ${request.data.owner}`);
            if (request.data.requestId)
              console.log(`リクエストID: ${request.data.requestId}`);
            if (request.data.metadataUri)
              console.log(`メタデータURI: ${request.data.metadataUri}`);
            if (request.data.priceEstimate)
              console.log(
                `価格見積もり: ${request.data.priceEstimate} lamports`
              );
            if (request.data.status)
              console.log(`ステータス: ${request.data.status}`);
            if (request.data.date)
              console.log(`作成日時: ${request.data.date}`);
          }
        } else if (request.type === "Error") {
          console.log(`エラー: ${request.error}`);
        }
      });
      break;
    }

    case "address": {
      // 特定のアドレスの情報を表示
      const address = process.argv[3];
      if (!address) {
        console.error("PDAを指定してください");
        console.log(
          "使用例: pnpm ts-node new-scripts/account-explorer.ts address <PDA>"
        );
        return;
      }

      const { program, connection } = initializeProgram();

      try {
        const pubkey = new PublicKey(address);
        const accountInfo = await connection.getAccountInfo(pubkey);

        if (!accountInfo) {
          console.log(`PDA ${address} のアカウントが見つかりません`);
          return;
        }

        console.log("\n=== アカウント情報 ===");
        console.log(`PDA: ${address}`);
        console.log(`所有者: ${accountInfo.owner.toString()}`);
        console.log(`実行可能: ${accountInfo.executable}`);
        console.log(`残高: ${accountInfo.lamports / 1e9} SOL`);
        console.log(`データサイズ: ${accountInfo.data.length} バイト`);

        // プログラムによるデコードを試みる
        if (program && accountInfo.owner.toString() === PROGRAM_ID) {
          try {
            // 購入リクエストとしてデコード
            const data = await program.account.purchaseRequest.fetch(pubkey);
            console.log("\n=== 購入リクエストデータ ===");
            console.log(`オーナー: ${data.owner.toString()}`);
            console.log(`リクエストID: ${data.requestId}`);
            console.log(`メタデータURI: ${data.metadataUri}`);
            console.log(
              `価格見積もり: ${data.priceEstimate.toString()} lamports`
            );
            console.log(`ステータス: ${Object.keys(data.status)[0]}`);
            console.log(`入金額: ${data.depositAmount.toString()} lamports`);
            console.log(
              `作成日時: ${new Date(
                Number(data.timestamp) * 1000
              ).toISOString()}`
            );
            return;
          } catch (e) {
            try {
              // グローバル設定としてデコード
              const config = await program.account.globalConfig.fetch(pubkey);
              console.log("\n=== グローバル設定データ ===");
              console.log(`管理者: ${config.admin.toString()}`);
              console.log(`送付先: ${config.depositTarget.toString()}`);
              return;
            } catch (e2) {
              // デコード失敗、バイナリパースを試みる
            }
          }
        }

        // バイナリパースを試みる
        try {
          const parsedData = parseStruct(accountInfo.data);
          console.log("\n=== バイナリパースデータ ===");
          console.log(parsedData);
        } catch (error) {
          console.log("\nデータをパースできませんでした");
        }
      } catch (error) {
        console.error("アドレス取得エラー:", error);
      }
      break;
    }

    case "help":
    default:
      console.log(`
使用方法:
  pnpm ts-node new-scripts/account-explorer.ts <コマンド> [引数...]

コマンド:
  config               - グローバル設定情報を表示
  all                  - すべてのプログラムアカウントを表示
  wallet <PDA>     - 特定のウォレットの購入リクエストを表示
  address <PDA>    - 特定のPDAのアカウント情報を表示
  help                 - このヘルプを表示
`);
      break;
  }
}

// 直接実行時のみmain関数を呼び出し
if (require.main === module) {
  main().catch(console.error);
}

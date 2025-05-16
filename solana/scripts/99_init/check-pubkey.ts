import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

/**
 * PublicKeyが有効か確認するスクリプト
 */
function checkPublicKey() {
  const inputKey = process.argv[2];
  if (!inputKey) {
    console.error("確認するPublicKeyを指定してください");
    console.error("使用例: pnpm tsx new-scripts/check-pubkey.ts [PublicKey]");
    process.exit(1);
  }

  console.log("入力された文字列:", inputKey);
  console.log("文字列の長さ:", inputKey.length, "文字");

  try {
    // PublicKeyに変換を試みる
    const pubkey = new PublicKey(inputKey);
    console.log("✅ 有効なPublicKeyです");
    console.log("変換後のPublicKey:", pubkey.toString());

    // バイト配列に変換
    const bytes = bs58.decode(pubkey.toString());
    console.log("バイト配列の長さ:", bytes.length, "バイト");

    return;
  } catch (error) {
    console.error("❌ 無効なPublicKeyです:", error.message);
  }

  // 文字列を細かく分析
  console.log("\n文字列を分析中...");

  // Base58で使用される文字のみで構成されているか
  const base58Regex =
    /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
  if (!base58Regex.test(inputKey)) {
    console.error("❌ Base58で使用されない文字が含まれています");

    // 問題の文字を特定
    for (let i = 0; i < inputKey.length; i++) {
      const char = inputKey[i];
      if (!base58Regex.test(char)) {
        console.error(`  位置 ${i + 1}: '${char}' は無効な文字です`);
      }
    }
  } else {
    console.log("✅ 文字はすべてBase58で有効です");
  }

  // 長さチェック
  if (inputKey.length < 32 || inputKey.length > 44) {
    console.error(
      `❌ 長さが異常です。通常は32〜44文字ですが、${inputKey.length}文字あります`
    );
  }

  // 修正候補を提案（一般的なミスの修正）
  console.log("\n可能性のある解決策:");
  console.log("1. 文字列が正確にコピーされているか確認してください");
  console.log("2. 文字列の前後に余分なスペースや改行がないか確認してください");
  console.log(
    "3. 類似文字 (0とO、l と1とI) が間違っていないか確認してください"
  );
  console.log(
    "4. 'list-purchase-requests.ts'で再度リストを表示して、正確なPDAをコピーしてください"
  );
}

// 実行
checkPublicKey();

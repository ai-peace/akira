import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import fetch from 'node-fetch'

// 管理者の公開鍵
const ADMIN_PUBLIC_KEY = 'B7LCdjikgtsA4DL5zBaEaoT3vVrtB7KwxHh4BjqkFZUF'
// Solana devnet RPC エンドポイント
const SOLANA_RPC_ENDPOINT = 'https://api.devnet.solana.com'

async function requestAirdrop() {
  try {
    console.log('Solana devnetから管理者アカウントにSOLをエアドロップします...')

    // Solana接続を作成
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed')

    // 公開鍵オブジェクトを作成
    const publicKey = new PublicKey(ADMIN_PUBLIC_KEY)

    // 現在の残高を確認
    const balanceBefore = await connection.getBalance(publicKey)
    console.log(`エアドロップ前の残高: ${balanceBefore / LAMPORTS_PER_SOL} SOL`)

    // Solana Faucetを使用してSOLをリクエスト
    console.log('Solana Faucetを使用してSOLをリクエストしています...')
    console.log('以下のURLにアクセスして手動でSOLをリクエストしてください:')
    console.log(`https://faucet.solana.com/?address=${ADMIN_PUBLIC_KEY}`)

    console.log('\n代替方法:')
    console.log('1. https://solfaucet.com/ にアクセス')
    console.log(`2. アドレス ${ADMIN_PUBLIC_KEY} を入力`)
    console.log('3. "Devnet"を選択して"Request"ボタンをクリック')

    // 残高の確認を待つ
    console.log('\n残高が更新されるまで待機しています...')
    console.log('手動でSOLをリクエストした後、Enterキーを押して残高を確認してください。')

    // ユーザーの入力を待つ代わりに、一定時間待機
    console.log('30秒後に残高を確認します...')
    await new Promise((resolve) => setTimeout(resolve, 30000))

    // エアドロップ後の残高を確認
    const balanceAfter = await connection.getBalance(publicKey)
    console.log(`現在の残高: ${balanceAfter / LAMPORTS_PER_SOL} SOL`)

    if (balanceAfter > balanceBefore) {
      console.log('SOLの追加が確認されました！')
    } else {
      console.log('残高に変化がありません。手動でSOLをリクエストしてください。')
    }
  } catch (error) {
    console.error('処理中にエラーが発生しました:', error)
  }
}

// スクリプトを実行
requestAirdrop()

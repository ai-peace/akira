import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { v4 as uuidv4 } from 'uuid'

// プロジェクトのトレジャリーウォレット（環境変数から取得するか、ハードコードする）
const TREASURY_WALLET = new PublicKey(
  process.env.NEXT_PUBLIC_TREASURY_WALLET || '11111111111111111111111111111111',
)

export function useDeposit() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deposit = async (amountInSOL: number) => {
    if (!publicKey) {
      setError('ウォレットが接続されていません')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: TREASURY_WALLET,
          lamports: amountInSOL * LAMPORTS_PER_SOL,
        }),
      )

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      // デポジット情報をサーバーに記録
      await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          amount: amountInSOL,
          signature,
          uniqueKey: uuidv4(),
        }),
      })

      setIsLoading(false)
      return true
    } catch (err) {
      console.error('デポジットエラー:', err)
      setError('デポジットに失敗しました')
      setIsLoading(false)
      return false
    }
  }

  return { deposit, isLoading, error }
}

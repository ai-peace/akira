import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair,
} from '@solana/web3.js'
import { v4 as uuidv4 } from 'uuid'
import { PrivyAccessTokenRepository } from '@/repository/privy-access-token.repository'
import { TREASURY_WALLET } from '@/config/solana.config'
import { usePrivy } from '@privy-io/react-auth'

export function useDeposit() {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const { authenticated, ready, user } = usePrivy()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deposit = async (amountInSOL: number) => {
    if (!publicKey) {
      setError('ウォレットが接続されていません')
      return false
    }

    if (!signTransaction) {
      setError('ウォレットがトランザクション署名をサポートしていません')
      return false
    }

    if (!authenticated) {
      setError('Privyで認証されていません')
      return false
    }

    // デモモードであることを確認
    if (amountInSOL <= 0.001) {
      console.log('デモモード: 少額のSOL送金を行います')
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log(`送金元: ${publicKey.toString()}`)
      console.log(`送金先: ${TREASURY_WALLET}`)
      console.log(`送金額: ${amountInSOL} SOL (${amountInSOL * LAMPORTS_PER_SOL} lamports)`)
      console.log(`認証状態: ${authenticated ? '認証済み' : '未認証'}`)
      console.log(`ユーザー情報: ${user ? JSON.stringify(user) : '取得できません'}`)

      // 残高確認
      const balance = await connection.getBalance(publicKey)
      console.log(`現在の残高: ${balance / LAMPORTS_PER_SOL} SOL`)

      if (balance < amountInSOL * LAMPORTS_PER_SOL) {
        throw new Error(
          `残高不足です。必要: ${amountInSOL} SOL, 現在: ${balance / LAMPORTS_PER_SOL} SOL`,
        )
      }

      // 最新のブロックハッシュを取得
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()

      // トランザクションを作成
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(TREASURY_WALLET),
          lamports: Math.floor(amountInSOL * LAMPORTS_PER_SOL),
        }),
      )

      // トランザクションにブロックハッシュを設定
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      // トランザクションに署名
      const signedTransaction = await signTransaction(transaction)

      // 署名済みトランザクションを送信
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      console.log(`トランザクション送信: ${signature}`)

      // トランザクションの確認を待つ
      const confirmation = await connection.confirmTransaction(
        {
          blockhash,
          lastValidBlockHeight,
          signature,
        },
        'confirmed',
      )

      if (confirmation.value.err) {
        throw new Error(`トランザクション確認エラー: ${JSON.stringify(confirmation.value.err)}`)
      }

      console.log(`トランザクション確認完了: ${signature}`)

      // Privyのアクセストークンを取得
      console.log('Privyアクセストークンの取得を試みます...')
      const accessToken = await PrivyAccessTokenRepository.get()
      console.log(`アクセストークン取得結果: ${accessToken ? '成功' : '失敗'}`)

      if (!accessToken) {
        // localStorage直接アクセスを試みる
        try {
          const directToken = localStorage.getItem('privy:token')
          console.log(`localStorage直接アクセス結果: ${directToken ? '成功' : '失敗'}`)

          if (directToken) {
            const cleanToken = directToken.replace(/"/g, '')
            console.log(`トークン: ${cleanToken.substring(0, 10)}...`)

            // 直接取得したトークンを使用
            const response = await fetch('/api/deposits', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${cleanToken}`,
              },
              body: JSON.stringify({
                walletAddress: publicKey.toString(),
                amount: amountInSOL,
                signature,
                uniqueKey: uuidv4(),
              }),
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'デポジット情報の保存に失敗しました')
            }

            setIsLoading(false)
            return true
          }
        } catch (localStorageError) {
          console.error('localStorage直接アクセスエラー:', localStorageError)
        }

        setError('認証情報が取得できませんでした')
        setIsLoading(false)
        return false
      }

      // デポジット情報をサーバーに記録
      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          amount: amountInSOL,
          signature,
          uniqueKey: uuidv4(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'デポジット情報の保存に失敗しました')
      }

      setIsLoading(false)
      return true
    } catch (err) {
      console.error('デポジットエラー:', err)
      setError(err instanceof Error ? err.message : 'デポジットに失敗しました')
      setIsLoading(false)
      return false
    }
  }

  return { deposit, isLoading, error }
}

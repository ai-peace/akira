// Solanaネットワーク設定
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
export const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com'
export const SOLANA_EXPLORER_URL = 'https://explorer.solana.com'

// トレジャリーウォレット（デモ用にシステムプログラムアドレスを使用）
export const TREASURY_WALLET =
  process.env.NEXT_PUBLIC_TREASURY_WALLET || 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'

// Solanaネットワーク設定
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
export const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com'
export const SOLANA_EXPLORER_URL = 'https://explorer.solana.com'

// トレジャリーウォレット
export const TREASURY_WALLET =
  process.env.NEXT_PUBLIC_TREASURY_WALLET || '11111111111111111111111111111111'

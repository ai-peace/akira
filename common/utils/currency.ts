/**
 * 通貨換算関連のユーティリティ関数
 */

// SOL/JPYの為替レート（フォールバック用）
const FALLBACK_SOL_JPY_RATE = 15000 // 1 SOL = 15,000 JPY (仮定値)

// 最後に取得したレートとタイムスタンプを保持
let cachedRate = {
  solJpy: FALLBACK_SOL_JPY_RATE,
  timestamp: 0, // 1970-01-01
}

/**
 * CoinGecko APIからSOL/JPYのレートを取得する
 * @returns 取得したレート、またはエラー時はnull
 */
export const fetchSolJpyRate = async (): Promise<number | null> => {
  try {
    // 5分以内に取得したキャッシュがあれば、それを返す（API制限対策）
    const now = Date.now()
    const cacheValidTime = 5 * 60 * 1000 // 5分（ミリ秒）

    if (now - cachedRate.timestamp < cacheValidTime) {
      return cachedRate.solJpy
    }

    // CoinGecko APIを呼び出し
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=jpy',
      {
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) {
      console.error('Failed to fetch SOL/JPY rate:', response.statusText)
      return null
    }

    const data = await response.json()
    if (data && data.solana && data.solana.jpy) {
      // キャッシュを更新
      cachedRate = {
        solJpy: data.solana.jpy,
        timestamp: now,
      }
      return data.solana.jpy
    }

    return null
  } catch (error) {
    console.error('Error fetching SOL/JPY rate:', error)
    return null
  }
}

/**
 * 現在のSOL/JPYレートを取得（APIから取得できない場合はフォールバック値を使用）
 * @returns SOL/JPYレート
 */
export const getSolJpyRate = async (): Promise<number> => {
  const rate = await fetchSolJpyRate()
  return rate || cachedRate.solJpy || FALLBACK_SOL_JPY_RATE
}

/**
 * 日本円(JPY)をSOLに変換する
 * @param jpyAmount 日本円の金額
 * @param rate SOL/JPYレート（指定しない場合はキャッシュ値またはフォールバック値を使用）
 * @returns SOL金額（小数点以下3桁まで）
 */
export const convertJpyToSol = (jpyAmount: number, rate?: number): number => {
  if (!jpyAmount || jpyAmount <= 0) return 0

  // レートが指定されていない場合はキャッシュまたはフォールバック値を使用
  const solJpyRate = rate || cachedRate.solJpy || FALLBACK_SOL_JPY_RATE

  // JPYをSOLに変換し、小数点以下3桁に丸める
  const solAmount = jpyAmount / solJpyRate
  return Math.round(solAmount * 1000) / 1000
}

/**
 * SOLを日本円(JPY)に変換する
 * @param solAmount SOL金額
 * @param rate SOL/JPYレート（指定しない場合はキャッシュ値またはフォールバック値を使用）
 * @returns 日本円金額（整数）
 */
export const convertSolToJpy = (solAmount: number, rate?: number): number => {
  if (!solAmount || solAmount <= 0) return 0

  // レートが指定されていない場合はキャッシュまたはフォールバック値を使用
  const solJpyRate = rate || cachedRate.solJpy || FALLBACK_SOL_JPY_RATE

  // SOLをJPYに変換し、整数に丸める
  return Math.round(solAmount * solJpyRate)
}

/**
 * 金額をフォーマットする（ロケールに応じた表示形式）
 * @param amount 金額
 * @param currency 通貨コード (例: 'JPY', 'SOL')
 * @param locale ロケール (デフォルト: 'ja-JP')
 * @returns フォーマットされた金額文字列
 */
export const formatCurrency = (
  amount: number,
  currency: string,
  locale: string = 'ja-JP',
): string => {
  // SOLの場合は小数点以下3桁まで表示
  if (currency.toUpperCase() === 'SOL') {
    return `${amount.toFixed(3)} ${currency}`
  }

  // その他の通貨はロケールに応じたフォーマットで表示
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      currencyDisplay: 'symbol',
    }).format(amount)
  } catch (error) {
    // フォールバック: シンプルな形式で表示
    return `${amount.toLocaleString(locale)} ${currency}`
  }
}

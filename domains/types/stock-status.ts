export const STOCK_STATUS = {
  AVAILABLE: 'available',
  REQUIRES_USER_CONFIRMATION: 'requires user confirmation',
  OUT_OF_STOCK: 'out-of-stock',
  UNKNOWN: 'unknown',
} as const

export type StockStatus = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS]

export const STOCK_STATUS_DISPLAY = {
  [STOCK_STATUS.AVAILABLE]: {
    en: 'In Stock',
    ja: '在庫あり',
  },
  [STOCK_STATUS.REQUIRES_USER_CONFIRMATION]: {
    en: 'Check Stock',
    ja: '在庫確認要',
  },
  [STOCK_STATUS.OUT_OF_STOCK]: {
    en: 'Out of Stock',
    ja: '在庫切れ',
  },
  [STOCK_STATUS.UNKNOWN]: {
    en: 'Unknown',
    ja: '不明',
  },
} as const

// レガシーステータス値のマッピング
const LEGACY_STATUS_MAPPING: Record<string, StockStatus> = {
  在庫あり: STOCK_STATUS.AVAILABLE,
  在庫あります: STOCK_STATUS.AVAILABLE,
  在庫確認します: STOCK_STATUS.REQUIRES_USER_CONFIRMATION,
  在庫なし: STOCK_STATUS.OUT_OF_STOCK,
  '': STOCK_STATUS.OUT_OF_STOCK,
}

export const getStockStatusDisplay = (status: string, lang: 'en' | 'ja' = 'en') => {
  const normalizedStatus = LEGACY_STATUS_MAPPING[status] || status
  return STOCK_STATUS_DISPLAY[normalizedStatus as StockStatus]?.[lang] || status
}

import { STOCK_STATUS } from '@/domains/types/stock-status'

const STORAGE_KEY = 'akira:stock-filter-status'

const DEFAULT_SELECTED_STATUSES = [STOCK_STATUS.AVAILABLE, STOCK_STATUS.REQUIRES_USER_CONFIRMATION]

const get = (): string[] => {
  try {
    if (typeof window === 'undefined') return DEFAULT_SELECTED_STATUSES

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SELECTED_STATUSES

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : DEFAULT_SELECTED_STATUSES
  } catch (e) {
    console.error('Failed to get stock filter status:', e)
    return DEFAULT_SELECTED_STATUSES
  }
}

const set = (statuses: string[]): void => {
  try {
    if (typeof window === 'undefined') return

    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses))
  } catch (e) {
    console.error('Failed to save stock filter status:', e)
    throw e
  }
}

const remove = (): void => {
  try {
    if (typeof window === 'undefined') return

    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error('Failed to remove stock filter status:', e)
    throw e
  }
}

export const StockFilterStatusRepository = {
  get,
  set,
  remove,
  DEFAULT_SELECTED_STATUSES,
}

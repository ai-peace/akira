import { HcApiError } from '@/domains/errors/frontend.error'
import { toast } from 'sonner'

const handleError = (error: unknown, options?: { description?: string }) => {
  const errorOptions = {
    ...options,
    style: {
      backgroundColor: '#FEE2E2', // 薄い赤色の背景
      border: '1px solid #FCA5A5', // 赤色のボーダー
      color: '#B91C1C', // 濃い赤色のテキスト
    },
  }

  if (error instanceof HcApiError) toast.error(error.message, errorOptions)
  else toast.error('Error', errorOptions)
}

export { handleError }

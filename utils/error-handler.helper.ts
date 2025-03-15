import { HcApiError } from '@/domains/errors/frontend.error'
import { toast } from 'sonner'

const handleError = (error: unknown, options?: { description?: string }) => {
  const errorOptions = {
    ...options,
    style: {
      backgroundColor: 'hsl(346.8 77.2% 49.8%)', // 薄い赤色の背景
      border: '1px solid hsl(346.8 77.2% 49.8%)', // 赤色のボーダー
      color: 'var(--foreground)', // 濃い赤色のテキスト
      title: 'var(--foreground)',
    },
  }

  if (error instanceof HcApiError) toast.error(error.message, errorOptions)
  else toast.error('Error', errorOptions)
}

export { handleError }

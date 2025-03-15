import { HcApiError } from '@/domains/errors/frontend.error'
import { toast } from 'sonner'

export const useErrorHandler = () => {
  const handleError = (error: unknown, options?: { description?: string }) => {
    if (error instanceof HcApiError) {
      toast.error(error.message, options)
    } else {
      toast.error('Error', options)
    }
  }

  return { handleError }
}

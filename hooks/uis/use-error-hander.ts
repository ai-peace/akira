import { HcApiError } from '@/domains/errors/client.error'
import { useToast } from '../use-toast'

export const useErrorHandler = () => {
  const { toast } = useToast()

  const handleError = (error: unknown) => {
    if (error instanceof HcApiError) {
      toast({
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return { handleError }
}

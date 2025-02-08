import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type Props = {
  className?: string
}

const Component = ({ className }: Props) => {
  return (
    <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-background/80">
      <Loader2 className={cn('h-8 w-8 animate-spin text-foreground', className)} />
    </div>
  )
}

export { Component as ECenteredLoadingSpinner }

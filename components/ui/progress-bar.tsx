import { cn } from '@/lib/utils'

type ProgressBarProps = {
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive'
}

const variantStyles = {
  default: 'bg-muted-foreground',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-emerald-500',
  warning: 'bg-yellow-500',
  destructive: 'bg-destructive',
}

const ProgressBar = ({ className, variant = 'default' }: ProgressBarProps) => {
  return (
    <div className={cn('h-1 w-8 overflow-hidden rounded-full bg-muted', className)}>
      <div className={cn('animate-progress-bar h-full w-full', variantStyles[variant])} />
    </div>
  )
}

export { ProgressBar }

import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ReactNode } from 'react'
import EDotFont from '../EDotFont'

type Props = Omit<ButtonProps, 'onClick'> & {
  icon?: ReactNode
  text: string
  href?: string
  onClick?: () => void
}

const Component = ({ className, icon, text, href, onClick, ...props }: Props) => {
  const buttonContent = (
    <>
      {icon}
      <EDotFont text={text} />
    </>
  )

  const buttonClassName = cn(
    'h-12 w-full rounded-full border-foreground bg-background-soft text-foreground shadow-none transition-colors hover:text-background',
    className,
  )

  if (href) {
    return (
      <Link href={href} className="w-full">
        <Button {...props} className={buttonClassName}>
          {buttonContent}
        </Button>
      </Link>
    )
  }

  return (
    <Button {...props} className={buttonClassName} onClick={onClick}>
      {buttonContent}
    </Button>
  )
}

export { Component as EDotButton }

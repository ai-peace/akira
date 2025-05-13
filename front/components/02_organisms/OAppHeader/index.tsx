import { FC, ReactNode } from 'react'
import { Button } from '../../ui/button'
import { ArrowLeft } from 'lucide-react'
import ELogoAkira from '../../01_elements/ELogoAkira'
import EShareButton from '../../01_elements/EShareButton'
import { OThemeChangeButton } from '../OThemeChangeButton'
import { useRouter } from 'next/navigation'

type Props = {
  leftFirst?: ReactNode
  leftSecond?: ReactNode
  center?: ReactNode
  rightFirst?: ReactNode
  rightSecond?: ReactNode
}

const Component: FC<Props> = ({
  leftFirst = <DefaultLeftFirst />,
  leftSecond,
  center = <DefaultCenter />,
  rightFirst = <DefaultRightFirst />,
  rightSecond = <DefaultRightSecond />,
}) => {
  return (
    <div className="sticky top-0 z-10 flex w-full items-center justify-between bg-background p-2">
      <div className="flex items-center gap-2">
        {leftFirst}
        {leftSecond}
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">{center}</div>

      <div className="flex items-center gap-2">
        {rightFirst}
        {rightSecond}
      </div>
    </div>
  )
}

export { Component as OAppHeader }

const DefaultLeftFirst = () => {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      onClick={() => router.back()}
      className="flex items-center justify-center p-2 text-foreground"
      size="icon"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  )
}

const DefaultCenter = () => {
  return <ELogoAkira width={80} height={34} />
}

const DefaultRightFirst = () => {
  return <EShareButton className="static bottom-auto right-auto z-auto" />
}

const DefaultRightSecond = () => {
  return <OThemeChangeButton />
}

import { OChatTextarea } from '@/components/02_organisms/OChatTextarea'
import { useErrorHandler } from '@/hooks/uis/use-error-hander'
import { FC } from 'react'

type Props = {
  onSubmit: (question: string) => Promise<any>
}

const Component: FC<Props> = ({ onSubmit }) => {
  const { handleError } = useErrorHandler()

  const handleSubmit = async (question: string) => {
    try {
      await onSubmit(question)
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <div className="absolute bottom-0 left-0 mt-auto w-full">
      <div className="mx-auto flex flex-1 gap-4 text-base md:mb-4 md:max-w-3xl md:gap-5 lg:max-w-[40rem] lg:gap-6 xl:mr-64 xl:max-w-[48rem] 2xl:mx-auto">
        <OChatTextarea onSubmit={handleSubmit} />
      </div>
    </div>
  )
}

export { Component as OChatInput }

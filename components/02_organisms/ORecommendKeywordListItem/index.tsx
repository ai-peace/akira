import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { RecommendKeywordEntity } from '@/domains/entities/recommend-keyword.entity'
import { FC } from 'react'

type Props = {
  keyword: RecommendKeywordEntity
  onClick: () => void
  isSubmitting?: boolean
  index?: number
}

const Component: FC<Props> = ({ keyword, onClick, index = 0, isSubmitting = false }) => {
  return (
    <div
      className="bg-background-light flex cursor-pointer items-center justify-center overflow-hidden rounded-full border p-1 text-foreground-strong transition-colors duration-300 hover:bg-background-muted"
      onClick={() => {
        if (onClick) {
          onClick()
        }
      }}
      style={{ opacity: isSubmitting ? 0.5 : 1 }}
    >
      {keyword.thumbnailUrl && (
        <div className="bg-muted/3 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={keyword.thumbnailUrl}
            alt={keyword.value.en}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex-grow px-2">
        <ETypewriterText text={keyword.value.en} delay={20 * index} />
      </div>
    </div>
  )
}

export { Component as ORecommendKeywordListItem }

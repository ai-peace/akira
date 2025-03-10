import { RecommendKeywordEntity } from '@/domains/entities/recommend-keyword.entity'
import { FC } from 'react'
import { ORecommendKeywordListItem } from '.'
import { cn } from '@/lib/utils'

type Props = {
  keywords: RecommendKeywordEntity[]
  isSubmitting?: boolean
  onClick: (keyword: RecommendKeywordEntity) => void
  className?: string
}

const Component: FC<Props> = ({ keywords, isSubmitting = false, onClick, className }) => {
  return (
    <div
      className={cn('flex flex-wrap justify-center gap-3', isSubmitting && 'opacity-10', className)}
    >
      {keywords.map((keyword, index) => (
        <ORecommendKeywordListItem
          key={keyword.value.en}
          keyword={keyword}
          index={index}
          onClick={() => onClick(keyword)}
        />
      ))}
    </div>
  )
}

export { Component as ORecommendKeywordListItemCollection }

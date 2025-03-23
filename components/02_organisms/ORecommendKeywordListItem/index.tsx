import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { RecommendKeywordEntity } from '@/domains/entities/recommend-keyword.entity'
import { FC } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  keyword: RecommendKeywordEntity
  onClick: () => void
  isSubmitting?: boolean
  index?: number
}

const Component: FC<Props> = ({ keyword, onClick, index = 0, isSubmitting = false }) => {
  const hasChildren = keyword.children && keyword.children.length > 0
  const isNavigationItem = keyword.value.en === 'Back' || keyword.value.en === 'Next'

  return (
    <div
      className={cn(
        'bg-background-light flex cursor-pointer items-center overflow-hidden rounded-full border p-1 text-foreground-strong transition-colors duration-300 hover:bg-background-muted',
        isNavigationItem && 'w-10 justify-center',
      )}
      onClick={() => {
        if (onClick) {
          onClick()
        }
      }}
      style={{ opacity: isSubmitting ? 0.5 : 1 }}
    >
      {isNavigationItem ? (
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
          {keyword.value.en === 'Back' ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
      ) : (
        <>
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
          {hasChildren && (
            <div className="mr-1 text-muted-foreground">
              <ChevronRight size={14} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export { Component as ORecommendKeywordListItem }

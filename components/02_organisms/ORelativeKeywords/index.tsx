import { Skeleton } from '@/components/ui/skeleton'
import { KeywordPair } from '@/server/domains/entities/prompt.entity'
import { FC } from 'react'

type Props = {
  keywords: KeywordPair[] | null
  handleCreateChatPromptGroupByKeyword: (keyword: KeywordPair) => void
}

const Component: FC<Props> = ({ keywords, handleCreateChatPromptGroupByKeyword }) => {
  return (
    <>
      <div>
        <div className="mb-2 text-xs font-bold">Relative keywords</div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {keywords && keywords.length > 0 ? (
            keywords?.slice(0, 10).map((keyword) => (
              <div
                key={keyword.en}
                className="cursor-pointer underline hover:no-underline hover:opacity-20"
                onClick={() => handleCreateChatPromptGroupByKeyword(keyword)}
              >
                {keyword.en} <span className="text-xs">({keyword.ja})</span>
              </div>
            ))
          ) : (
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton key={index} className="h-3 w-20 rounded-full" />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export { Component as ORelativeKeywords }

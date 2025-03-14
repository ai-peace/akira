'use client'

import { TProductSearch } from '@/components/03_templates/TProductSearch'
import { usePromptGroup } from '@/hooks/resources/prompt-groups/usePromptGroup'
import { FC } from 'react'

type Props = {
  promptGroupUniqueKey: string
}

const Component: FC<Props> = ({ promptGroupUniqueKey }) => {
  const { promptGroup } = usePromptGroup({ uniqueKey: promptGroupUniqueKey })

  return (
    <>
      {/* ここから */}
      {promptGroup?.prompts.map((prompt) => {
        return (
          <div key={prompt.uniqueKey} className="w-full">
            {prompt.resultType === 'FOUND_PRODUCT_ITEMS' && (
              <TProductSearch
                key={prompt.uniqueKey}
                products={prompt.result?.data}
                chatUniqueKey={promptGroup?.chatUniqueKey}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

export { Component as SSearchResultScreen }

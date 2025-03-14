'use client'

import { TProductSearch } from '@/components/03_templates/TProductSearch'
import { usePromptGroup } from '@/hooks/resources/prompt-groups/usePromptGroup'
import { FC, useState } from 'react'

type Props = {
  promptGroupUniqueKey: string
}

const Component: FC<Props> = ({ promptGroupUniqueKey }) => {
  const [showModal, setShowModal] = useState(true)
  const { promptGroup } = usePromptGroup({ uniqueKey: promptGroupUniqueKey })

  return (
    <>
      {/* ここから */}
      {promptGroup?.prompts.map((prompt) => {
        return (
          <div key={prompt.uniqueKey}>
            {prompt.resultType === 'FOUND_PRODUCT_ITEMS' && (
              <TProductSearch
                key={prompt.uniqueKey}
                showModal={showModal}
                setShowModal={setShowModal}
                products={prompt.result?.data}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

export { Component as SSearchResultScreen }

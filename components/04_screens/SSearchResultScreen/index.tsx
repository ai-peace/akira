'use client'

import { OProductListModal } from '@/components/02_organisms/OProductListModal'
import { usePromptGroup } from '@/hooks/resources/prompt-groups/usePromptGroup'
import { FC, useState } from 'react'

type Props = {
  promptGroupUniqueKey: string
}

const Component: FC<Props> = ({ promptGroupUniqueKey }) => {
  const [showModal, setShowModal] = useState(true)
  const { promptGroup } = usePromptGroup({ uniqueKey: promptGroupUniqueKey })

  console.log(promptGroup?.prompts)

  return (
    <>
      {/* ここから */}
      {/* <OProductListModal
        key={promptGroup?.uniqueKey}
        showModal={showModal}
        setShowModal={setShowModal}
        products={promptGroup?.prompts}
      /> */}
    </>
  )
}

export { Component as SSearchResultScreen }

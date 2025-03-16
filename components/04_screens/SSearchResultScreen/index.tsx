'use client'

import EShareButton from '@/components/01_elements/EShareButton'
import { OThemeChangeButton } from '@/components/02_organisms/OThemeChangeButton'
import { TProductSearch } from '@/components/03_templates/TProductSearch'
import { usePromptGroup } from '@/hooks/resources/prompt-groups/usePromptGroup'
import { ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'
import { FC } from 'react'

type Props = {
  promptGroupUniqueKey: string
}

const Component: FC<Props> = ({ promptGroupUniqueKey }) => {
  const { promptGroup } = usePromptGroup({ uniqueKey: promptGroupUniqueKey })

  return (
    <div className="block w-full">
      <div className="relative bg-background">
        <div className="relative flex items-center justify-between p-2 md:p-2">
          {promptGroup?.chatUniqueKey ? (
            <Link href={`/chats/${promptGroup?.chatUniqueKey}`}>
              <button className="flex items-center gap-2 rounded-full p-2 text-foreground hover:bg-secondary">
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            </Link>
          ) : (
            <div className="h-6" />
          )}
          <h2 className="text-md absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-foreground-strong">
            All products
          </h2>
          <div className="flex items-center gap-2">
            <EShareButton className="static bottom-auto right-auto z-auto" />
            <OThemeChangeButton />
          </div>
        </div>
      </div>
      {/* Product search results */}
      {promptGroup?.prompts.map((prompt) => {
        return (
          <div key={prompt.uniqueKey} className="w-full">
            {prompt.resultType === 'FOUND_PRODUCT_ITEMS' && (
              <TProductSearch
                key={prompt.uniqueKey}
                products={prompt.result?.data}
                chatUniqueKey={promptGroup?.chatUniqueKey}
                promptGroupUniqueKey={promptGroupUniqueKey}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export { Component as SSearchResultScreen }

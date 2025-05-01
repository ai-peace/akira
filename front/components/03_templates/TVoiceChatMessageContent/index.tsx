import { PromptGroupEntity } from '@/common/domains/entities/prompt-group.entity'
import { EMdxRenderer } from '@/front/components/01_elements/EMdxRenderer'
import { EOptimisticPromptGroup } from '@/front/components/01_elements/EOptimisticPromptGroup'
import ETypewriterText from '@/front/components/01_elements/ETypewriterText'
import { OChatBubbleProduct } from '@/front/components/02_organisms/OChatBubbleProduct'
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '@/front/components/ui/chat/chat-bubble'
import { ChatMessageList } from '@/front/components/ui/chat/chat-message-list'
import { useErrorHandler } from '@/front/hooks/uis/use-error-hander'
import { FC, Fragment, useEffect, useRef, useState, useMemo } from 'react'
import MessageLoading from '../../ui/chat/message-loading'

type Props = {
  promptGroups?: PromptGroupEntity[]
  createChatPromptGroup: (question: string) => Promise<any>
  onIntersect?: (promptGroupId: string) => void
}

const Component: FC<Props> = ({ promptGroups, createChatPromptGroup, onIntersect }) => {
  const messageListRef = useRef<HTMLDivElement>(null)
  const [optimisticPromptGroup, setOptimisticPromptGroup] = useState<{
    question: string
  } | null>(null)
  const { handleError } = useErrorHandler()

  const latestPromptGroup = promptGroups?.[promptGroups.length - 1]

  // チャットが更新されたらoptimisticPromptGroupをリセット
  useEffect(() => {
    setOptimisticPromptGroup(null)
  }, [promptGroups])

  const handleCreateChatPromptGroup = async (question: string) => {
    setOptimisticPromptGroup({ question: question })
    try {
      await createChatPromptGroup(question)
    } catch (error) {
      setOptimisticPromptGroup(null)
      handleError(error)
    }
  }

  return (
    <div className="relative mt-40 flex-1">
      <div
        ref={messageListRef}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent relative h-full overflow-y-scroll overscroll-y-contain scroll-smooth pb-64 [-webkit-overflow-scrolling:touch]"
      >
        <div className="mx-auto block md:max-w-3xl md:gap-5 lg:max-w-[40rem] lg:gap-6 xl:max-w-[48rem] 2xl:mx-auto">
          <ChatMessageList className="-mt-[48px]">
            {latestPromptGroup && (
              <PromptGroupComponent
                promptGroup={latestPromptGroup}
                handleCreateChatPromptGroup={handleCreateChatPromptGroup}
              />
            )}
          </ChatMessageList>
        </div>
      </div>

      {latestPromptGroup && <PromptGroupQuestion promptGroup={latestPromptGroup} />}
    </div>
  )
}

export { Component as TVoiceChatMessageContent }

const PromptGroupComponent = ({
  promptGroup,
  handleCreateChatPromptGroup,
}: {
  promptGroup: PromptGroupEntity
  handleCreateChatPromptGroup: (question: string) => Promise<any>
}) => {
  return (
    <Fragment key={promptGroup.uniqueKey}>
      {promptGroup.prompts?.map((prompt) => {
        // 商品データを価格の高い順にソート
        const sortedProducts = useMemo(() => {
          if (!prompt.result?.data) return []

          return [...prompt.result.data].sort((a, b) => {
            // 価格でソート（高い順）
            const priceA = a.price || 0
            const priceB = b.price || 0
            return priceB - priceA
          })
        }, [prompt.result?.data])

        return (
          <Fragment key={prompt.uniqueKey}>
            {prompt.llmStatus === 'SUCCESS' ? (
              <>
                {prompt.resultType === 'FOUND_PRODUCT_ITEMS' && (
                  <>
                    <OChatBubbleProduct
                      products={sortedProducts} // ソート済みの商品データを使用
                      message={prompt.result?.message || ''}
                      promptGroupUniqueKey={promptGroup.uniqueKey}
                      messageDisplayable={false} // NOTE voice改造
                    />
                  </>
                )}

                {prompt.resultType === 'NO_PRODUCT_ITEMS' && (
                  <ChatBubble variant="received">
                    <ChatBubbleAvatar fallback="AI" src="/images/picture/picture_akira-kun.png" />
                    <ChatBubbleMessage variant="received" className="text-sm md:text-base">
                      <ETypewriterText text={prompt.result?.message || ''} delay={200} />
                    </ChatBubbleMessage>
                  </ChatBubble>
                )}

                {prompt.resultType === 'AGENT_RESPONSE' && (
                  <EMdxRenderer
                    content={prompt.result?.message || ''}
                    className="mt-4"
                    onSearch={handleCreateChatPromptGroup}
                  />
                )}
              </>
            ) : (
              <div className="mt-[32px] flex w-full justify-center md:mt-[100px]">
                <MessageLoading />
              </div>
            )}
          </Fragment>
        )
      })}
    </Fragment>
  )
}

const PromptGroupQuestion = ({ promptGroup }: { promptGroup: PromptGroupEntity }) => {
  return (
    <div className="absolute bottom-16 left-0 right-0 flex justify-center bg-background py-6 text-primary/50">
      <ETypewriterText text={promptGroup.question} delay={1000} />
    </div>
  )
}

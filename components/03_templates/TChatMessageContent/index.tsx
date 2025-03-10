import { EOptimisticPromptGroup } from '@/components/01_elements/EOptimisticPromptGroup'
import { EMdxRenderer } from '@/components/01_elements/EMdxRenderer'
import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { OChatBubbleProduct } from '@/components/02_organisms/OChatBubbleProduct'
import { OChatInput } from '@/components/02_organisms/OChatInput'
import { ORelativeKeywords } from '@/components/02_organisms/ORelativeKeywords'
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble'
import { ChatMessageList } from '@/components/ui/chat/chat-message-list'
import { PromptGroupEntity } from '@/domains/entities/prompt-group.entity'
import { useErrorHandler } from '@/hooks/uis/use-error-hander'
import { KeywordPair } from '@/server/domains/entities/prompt.entity'
import { FC, Fragment, useEffect, useRef, useState } from 'react'

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

  // チャットが更新されたらoptimisticPromptGroupをリセット
  useEffect(() => {
    setOptimisticPromptGroup(null)
  }, [promptGroups])

  // スクロール位置の監視
  useEffect(() => {
    if (!messageListRef.current || !onIntersect) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            onIntersect(entry.target.id)
          }
        })
      },
      {
        root: messageListRef.current,
        threshold: 0.5,
      },
    )

    const elements = document.querySelectorAll('[data-prompt-group]')
    elements.forEach((element) => observer.observe(element))

    return () => {
      elements.forEach((element) => observer.unobserve(element))
    }
  }, [promptGroups, onIntersect])

  // 新しいメッセージが追加されたときに自動スクロール
  useEffect(() => {
    if (messageListRef.current) {
      setTimeout(() => {
        messageListRef.current?.scrollTo({
          top: messageListRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }, 100)
    }
  }, [promptGroups?.length, promptGroups, optimisticPromptGroup])

  const handleCreateChatPromptGroup = async (question: string) => {
    setOptimisticPromptGroup({ question: question })
    try {
      await createChatPromptGroup(question)
    } catch (error) {
      setOptimisticPromptGroup(null)
      handleError(error)
    }
  }

  const handleCreateChatPromptGroupByKeyword = async (keyword: KeywordPair) => {
    setOptimisticPromptGroup({ question: keyword.en })
    try {
      await createChatPromptGroup(keyword.ja)
    } catch (error) {
      setOptimisticPromptGroup(null)
      handleError(error)
    }
  }

  return (
    <div className="relative flex-1">
      <div
        ref={messageListRef}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent relative h-full overflow-y-scroll overscroll-y-contain scroll-smooth pb-64 [-webkit-overflow-scrolling:touch]"
      >
        <div className="mx-auto block md:max-w-3xl md:gap-5 lg:max-w-[40rem] lg:gap-6 xl:mr-64 xl:max-w-[48rem] 2xl:mx-auto">
          <ChatMessageList>
            {promptGroups?.map((promptGroup) => {
              return (
                <Fragment key={promptGroup.uniqueKey}>
                  {/* 質問 */}
                  <div id={promptGroup.uniqueKey} data-prompt-group className="flex justify-end">
                    <ChatBubble variant="sent">
                      <ChatBubbleAvatar fallback="Y" />
                      <ChatBubbleMessage variant="sent">{promptGroup.question}</ChatBubbleMessage>
                    </ChatBubble>
                  </div>
                  {/* 回答 */}
                  {promptGroup.prompts?.map((prompt) => {
                    return (
                      <Fragment key={prompt.uniqueKey}>
                        {prompt.llmStatus === 'SUCCESS' ? (
                          <>
                            {prompt.resultType === 'FOUND_PRODUCT_ITEMS' && (
                              <>
                                <OChatBubbleProduct
                                  products={prompt.result?.data}
                                  message={prompt.result?.message || ''}
                                />
                                {prompt.result?.keywords && (
                                  <ORelativeKeywords
                                    keywords={prompt.result.keywords as unknown as KeywordPair[]}
                                    handleCreateChatPromptGroupByKeyword={
                                      handleCreateChatPromptGroupByKeyword
                                    }
                                  />
                                )}
                              </>
                            )}
                            {prompt.resultType === 'FIRST_RESPONSE' && (
                              <ChatBubble variant="received">
                                <ChatBubbleAvatar
                                  fallback="AI"
                                  src="/images/picture/picture_akira-kun.png"
                                />
                                <ChatBubbleMessage variant="received">
                                  <ETypewriterText
                                    text={prompt.result?.message || ''}
                                    delay={200}
                                  />
                                </ChatBubbleMessage>
                              </ChatBubble>
                            )}
                            {prompt.resultType === 'NO_PRODUCT_ITEMS' && (
                              <ChatBubble variant="received">
                                <ChatBubbleAvatar
                                  fallback="AI"
                                  src="/images/picture/picture_akira-kun.png"
                                />
                                <ChatBubbleMessage variant="received">
                                  <ETypewriterText
                                    text={prompt.result?.message || ''}
                                    delay={200}
                                  />
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
                          <>
                            <ChatBubble variant="received">
                              <ChatBubbleAvatar
                                fallback="AI"
                                src="/images/picture/picture_akira-kun.png"
                              />
                              <ChatBubbleMessage isLoading />
                            </ChatBubble>
                          </>
                        )}
                      </Fragment>
                    )
                  })}
                </Fragment>
              )
            })}
            {optimisticPromptGroup && (
              <EOptimisticPromptGroup question={optimisticPromptGroup.question} />
            )}
          </ChatMessageList>
        </div>
      </div>

      <OChatInput onSubmit={handleCreateChatPromptGroup} />
    </div>
  )
}

export { Component as TChatMessageContent }

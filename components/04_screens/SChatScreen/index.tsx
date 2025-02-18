'use client'
import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { OChatTextarea } from '@/components/02_organisms/OChatTextarea'
import { Card } from '@/components/ui/card'
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble'
import { ChatMessageList } from '@/components/ui/chat/chat-message-list'
import { ProductEntity } from '@/domains/entities/product.entity'
import { useChat } from '@/hooks/resources/chats/useChat'
import { FC, Fragment, useEffect, useRef, useState } from 'react'
import { ECenteredLoadingSpinner } from '@/components/01_elements/ECenteredLoadingSpinner'
import { KeywordPair } from '@/server/domains/entities/prompt.entity'
import { Skeleton } from '@/components/ui/skeleton'
import { EMdxRenderer } from '@/components/01_elements/EMdxRenderer'
import OProductListItem from '@/components/02_organisms/OProductListItem'

type Props = {
  chatUniqueKey: string
}

const Component: FC<Props> = ({ chatUniqueKey }) => {
  const { chat, chatError, chatIsLoading, chatErrorType, createChatPromptGroup } = useChat({
    uniqueKey: chatUniqueKey,
  })
  const [optimisticPromptGroup, setOptimisticPromptGroup] = useState<{
    question: string
  } | null>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null)

  useEffect(() => {
    if (!messageListRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCurrentPromptId(entry.target.id)
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
  }, [chat?.promptGroups])

  useEffect(() => {
    if (!chatIsLoading && chat && messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chat, chatIsLoading])

  useEffect(() => {
    setOptimisticPromptGroup(null)
  }, [chat])

  useEffect(() => {
    if (optimisticPromptGroup && messageListRef.current) {
      setTimeout(() => {
        messageListRef.current?.scrollTo({
          top: messageListRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }, 100)
    }
  }, [optimisticPromptGroup])

  useEffect(() => {
    if (chat && messageListRef.current) {
      setTimeout(() => {
        messageListRef.current?.scrollTo({
          top: messageListRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }, 100)
    }
  }, [chat?.promptGroups?.length, chat])

  const handleCreateChatPromptGroup = async (question: string) => {
    setOptimisticPromptGroup({ question: question })
    await createChatPromptGroup(question)
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  const handleCreateChatPromptGroupByKeyword = async (keyword: KeywordPair) => {
    setOptimisticPromptGroup({ question: keyword.en })
    await createChatPromptGroup(keyword.ja)
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  if (chatIsLoading)
    return (
      <div className="relative flex h-full w-full">
        <ECenteredLoadingSpinner />
      </div>
    )
  if (!chat) return <div>Chat not found</div>
  if (chatError) return <div>Error: {chatError.message}</div>

  return (
    <>
      <div className="relative flex h-full w-full">
        <div className="flex-1">
          <div
            ref={messageListRef}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent relative h-full overflow-y-scroll overscroll-y-contain scroll-smooth pb-64 [-webkit-overflow-scrolling:touch]"
          >
            <div className="mx-auto block md:max-w-3xl md:gap-5 lg:max-w-[40rem] lg:gap-6 xl:mr-64 xl:max-w-[48rem] 2xl:mx-auto">
              <ChatMessageList>
                {chat.promptGroups?.map((promptGroup) => {
                  return (
                    <Fragment key={promptGroup.uniqueKey}>
                      {/* 質問 */}
                      <div
                        id={promptGroup.uniqueKey}
                        data-prompt-group
                        className="flex justify-end"
                      >
                        <ChatBubble variant="sent">
                          <ChatBubbleAvatar fallback="Y" />
                          <ChatBubbleMessage variant="sent">
                            {promptGroup.question}
                          </ChatBubbleMessage>
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
                                    <ChatBubbleProduct
                                      products={prompt.result?.data}
                                      message={prompt.result?.message || ''}
                                    />
                                    {prompt.result?.keywords && (
                                      <RelativeKeywords
                                        keywords={
                                          prompt.result.keywords as unknown as KeywordPair[]
                                        }
                                        handleCreateChatPromptGroupByKeyword={
                                          handleCreateChatPromptGroupByKeyword
                                        }
                                      />
                                    )}
                                  </>
                                )}
                                {prompt.resultType === 'FIRST_RESPONSE' && (
                                  <ChatBubble variant="received">
                                    <ChatBubbleAvatar fallback="AI" />
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
                                    <ChatBubbleAvatar fallback="AI" />
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
                                  <ChatBubbleAvatar fallback="AI" />
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
                  <OptimisticPromptGroup question={optimisticPromptGroup.question} />
                )}
              </ChatMessageList>
            </div>
          </div>

          <ChatInputSection createChatPromptGroup={handleCreateChatPromptGroup} />
        </div>

        {/* 目次セクション */}
        <div className="fixed right-0 top-0 hidden h-full w-64 p-4 xl:flex xl:flex-col">
          <div className="mb-4 text-sm font-medium">Chat history</div>
          <div className="max-h-[calc(100vh-8rem)] space-y-2 overflow-y-auto">
            {chat.promptGroups?.map((promptGroup) => (
              <div
                key={promptGroup.uniqueKey}
                className={`cursor-pointer truncate text-xs transition-colors ${
                  currentPromptId === promptGroup.uniqueKey
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => {
                  const element = document.getElementById(promptGroup.uniqueKey)
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {promptGroup.question}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export { Component as SChatScreen }

const ChatBubbleProduct = ({
  products,
  message,
}: {
  products: ProductEntity[]
  message: string
}) => {
  const [showModal, setShowModal] = useState(false)
  const [displayCount] = useState(8)

  const handleShowMore = () => {
    setShowModal(true)
  }

  return (
    <>
      <ChatBubble variant="received">
        <ChatBubbleAvatar fallback="AI" />
        <ChatBubbleMessage variant="received">
          <ETypewriterText text={message} delay={200} />
        </ChatBubbleMessage>
      </ChatBubble>
      <div className="grid w-full grid-cols-4 gap-2">
        {products.slice(0, displayCount).map((product) => (
          <OProductListItem key={product.itemCode} product={product} />
        ))}
      </div>
      {products.length > displayCount && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleShowMore}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-all hover:bg-blue-600"
          >
            Show all ({products.length} items)
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-[90vw] overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">All products ({products.length} items)</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-6 gap-4">
              {products.map((product) => (
                <OProductListItem key={product.itemCode} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

type ChatInputSectionProps = {
  createChatPromptGroup: (question: string) => Promise<any>
}

const ChatInputSection = ({ createChatPromptGroup }: ChatInputSectionProps) => {
  const handleSubmit = async (question: string) => {
    try {
      await createChatPromptGroup(question)
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }
  return (
    <div className="absolute bottom-0 left-0 mt-auto w-full bg-background">
      <div className="mx-auto mb-4 flex flex-1 gap-4 text-base md:max-w-3xl md:gap-5 lg:max-w-[40rem] lg:gap-6 xl:mr-64 xl:max-w-[48rem] 2xl:mx-auto">
        <OChatTextarea onSubmit={handleSubmit} />
      </div>
    </div>
  )
}

const RelativeKeywords = ({
  keywords,
  handleCreateChatPromptGroupByKeyword,
}: {
  keywords: { en: string; ja: string }[] | null
  handleCreateChatPromptGroupByKeyword: (keyword: { en: string; ja: string }) => void
}) => {
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

const OptimisticPromptGroup = ({ question }: { question: string }) => {
  return (
    <>
      <div className="flex justify-end">
        <ChatBubble variant="sent">
          <ChatBubbleAvatar fallback="Y" />
          <ChatBubbleMessage variant="sent">{question}</ChatBubbleMessage>
        </ChatBubble>
      </div>
      <ChatBubble variant="received">
        <ChatBubbleAvatar fallback="AI" />
        <ChatBubbleMessage isLoading />
      </ChatBubble>
    </>
  )
}

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
                      <div id={promptGroup.uniqueKey} className="flex justify-end">
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
                className="cursor-pointer truncate text-xs text-gray-500 hover:text-gray-700"
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
  return (
    <>
      <ChatBubble variant="received">
        <ChatBubbleAvatar fallback="AI" />
        <ChatBubbleMessage variant="received">
          <ETypewriterText text={message} delay={200} />
        </ChatBubbleMessage>
      </ChatBubble>
      <div className="grid w-full grid-cols-3 gap-2">
        {products.slice(0, 20).map((product) => (
          <Card
            key={`${product.itemCode}-${product.title.en}`}
            className="overflow-hidden shadow-none"
          >
            <a href={product.url} target="_blank" rel="noopener noreferrer">
              <div className="relative flex h-[320px] w-full items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.imageUrl}
                  alt={product.title.en}
                  width={100}
                  height={300}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col p-2">
                <div className="group relative text-xs">
                  <span>{product.title.en}</span>
                  <span className="invisible absolute -top-8 left-0 whitespace-nowrap rounded bg-gray-800 p-2 text-xs text-white group-hover:visible">
                    {product.title.ja}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-red-500">
                    ${Math.round(product.price / 150).toLocaleString()}
                  </div>
                  <div
                    className={`text-xs ${
                      product.status === 'In Stock'
                        ? 'text-green-600'
                        : product.status === 'Out of Stock'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                    }`}
                  >
                    {product.status}
                  </div>
                </div>
              </div>
            </a>
          </Card>
        ))}
      </div>
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

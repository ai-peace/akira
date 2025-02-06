'use client'
import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { OChatTextarea } from '@/components/02_organisms/OChatTextarea'
import { Card } from '@/components/ui/card'
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble'
import { ChatMessageList } from '@/components/ui/chat/chat-message-list'
import { ProductEntity } from '@/domains/entities/product.entity'
import { useChat } from '@/hooks/resources/chats/useChat'
import { FC, Fragment, useRef, useEffect } from 'react'

type Props = {
  chatUniqueKey: string
}

const Component: FC<Props> = ({ chatUniqueKey }) => {
  const { chat, chatError, chatIsLoading, chatErrorType, createChatPromptGroup } = useChat({
    uniqueKey: chatUniqueKey,
  })
  const messageListRef = useRef<HTMLDivElement>(null)

  // 初回ロード時のスクロール
  useEffect(() => {
    if (!chatIsLoading && chat && messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chat, chatIsLoading])

  // 検索開始時のスクロール
  const handleCreateChatPromptGroup = async (question: string) => {
    await createChatPromptGroup(question)
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  if (chatIsLoading) return <div>Loading...</div>
  if (!chat) return <div>Chat not found</div>
  if (chatError) return <div>Error: {chatError.message}</div>

  return (
    <>
      <div className="relative h-full">
        <div
          ref={messageListRef}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent relative h-full overflow-y-scroll overscroll-y-contain scroll-smooth pb-64 [-webkit-overflow-scrolling:touch]"
        >
          <div className="mx-auto block md:max-w-3xl md:gap-5 lg:max-w-[40rem] lg:gap-6 xl:max-w-[48rem]">
            <ChatMessageList>
              {chat.promptGroups?.map((promptGroup) => {
                return (
                  <Fragment key={promptGroup.uniqueKey}>
                    {/* 質問 */}
                    <ChatBubble variant="sent">
                      <ChatBubbleAvatar fallback="Y" />
                      <ChatBubbleMessage variant="sent">{promptGroup.question}</ChatBubbleMessage>
                    </ChatBubble>
                    {/* 回答 */}
                    {promptGroup.prompts?.map((prompt) => {
                      return (
                        <Fragment key={prompt.uniqueKey}>
                          {prompt.llmStatus === 'SUCCESS' ? (
                            <>
                              {prompt.resultType === 'FOUND_PRODUCT_ITEMS' && (
                                <ChatBubbleProduct products={prompt.result?.data} />
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
            </ChatMessageList>
          </div>
        </div>

        <ChatInputSection createChatPromptGroup={handleCreateChatPromptGroup} />
      </div>
    </>
  )
}

export { Component as SChatScreen }

const ChatBubbleProduct = ({ products }: { products: ProductEntity[] }) => {
  return (
    <ChatBubble variant="received">
      <ChatBubbleAvatar fallback="AI" />
      <div className="grid w-full grid-cols-2 gap-2">
        {products.slice(0, 9).map((product) => (
          <>
            <Card key={product.title} className="overflow-hidden shadow-none">
              <a href={product.url} target="_blank" rel="noopener noreferrer">
                <div className="relative flex h-40 w-full items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    width={100}
                    height={100}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col p-2">
                  <div className="text-xs">{product.title}</div>
                  <div className="mt-2 text-sm text-red-500">
                    ${Math.round(product.price / 150)}
                  </div>
                </div>
              </a>
            </Card>
          </>
        ))}
      </div>
    </ChatBubble>
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
      throw error // 再スローしてフォーム側でハンドリング可能に
    }
  }
  return (
    <div className="absolute bottom-0 left-0 mt-auto w-full bg-background">
      <div className="mx-auto mb-4 flex flex-1 gap-4 text-base md:max-w-3xl md:gap-5 lg:max-w-[40rem] lg:gap-6 xl:max-w-[48rem]">
        <OChatTextarea onSubmit={handleSubmit} />
      </div>
    </div>
  )
}

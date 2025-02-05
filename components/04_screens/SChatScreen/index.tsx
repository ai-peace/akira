'use client'
import { OChatTextarea } from '@/components/02_organisms/OChatTextarea'
import { Card } from '@/components/ui/card'
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble'
import { ChatMessageList } from '@/components/ui/chat/chat-message-list'
import { ProductEntity } from '@/domains/entities/product.entity'
import { useChat } from '@/hooks/resources/chats/useChat'
import { FC } from 'react'

type Props = {
  chatUniqueKey: string
}

const Component: FC<Props> = ({ chatUniqueKey }) => {
  const { chat, chatError, chatIsLoading, chatErrorType, createChatPrompt } = useChat({
    uniqueKey: chatUniqueKey,
  })

  if (chatIsLoading) return <div>Loading...</div>
  if (!chat) return <div>Chat not found</div>
  if (chatError) return <div>Error: {chatError.message}</div>

  return (
    <>
      <div className="relative h-full">
        <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent relative h-full overflow-y-scroll overscroll-y-contain scroll-smooth pb-64 [-webkit-overflow-scrolling:touch]">
          <div className="mx-auto block md:max-w-3xl md:gap-5 lg:max-w-[40rem] lg:gap-6 xl:max-w-[48rem]">
            <ChatMessageList>
              {chat.promptGroups?.map((promptGroup) =>
                promptGroup.prompts?.map((prompt) =>
                  prompt.llmStatus === 'SUCCESS' ? (
                    <>
                      <ChatBubble variant="sent">
                      <ChatBubbleAvatar fallback="Y" />
                      <ChatBubbleMessage variant="sent">{prompt.mainPrompt}</ChatBubbleMessage>
                    </ChatBubble>
                    {prompt.resultType === 'RARE_ITEM_SEARCH' && (
                      <ChatBubbleProduct products={prompt.result} />
                    )}
                    {prompt.resultType === 'INITIAL_RESPONSE' && (
                      <ChatBubble variant="received">
                        <ChatBubbleAvatar fallback="AI" />
                        <ChatBubbleMessage variant="received">
                          {prompt.mainPrompt}
                        </ChatBubbleMessage>
                      </ChatBubble>
                    )}
                  </>
                ) : prompt.llmStatus === 'PROCESSING' ? (
                  <>
                    <ChatBubble variant="sent">
                      <ChatBubbleAvatar fallback="Y" />
                      <ChatBubbleMessage variant="sent">{prompt.mainPrompt}</ChatBubbleMessage>
                    </ChatBubble>
                    <ChatBubble variant="received">
                      <ChatBubbleAvatar fallback="AI" />
                      <ChatBubbleMessage isLoading />
                    </ChatBubble>
                  </>
                ) : (
                  <></>
                ),
              )}
              {/* <ChatBubble variant="sent">
            <ChatBubbleAvatar fallback="Y" />
            <ChatBubbleMessage variant="sent">{chat?.prompts?.[0]?.mainPrompt}</ChatBubbleMessage>
          </ChatBubble> */}
              {/* アイテム */}
              {/* <ChatBubble variant="received">
            <ChatBubbleAvatar fallback="AI" />
            <ChatBubbleMessage variant="received">
              <ETypewriterText text="Hi, I am doing well, thank you for asking. How can I help you today?" />
            </ChatBubbleMessage>
          </ChatBubble> */}
              {/* ローディング */}
              {/* <ChatBubble variant="received">
            <ChatBubbleAvatar fallback="AI" />
            <ChatBubbleMessage isLoading />
          </ChatBubble>*/}
            </ChatMessageList>
          </div>
        </div>

        <ChatInputSection createChatPrompt={createChatPrompt} />
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
  createChatPrompt: (mainPrompt: string) => Promise<any>
}

const ChatInputSection = ({ createChatPrompt }: ChatInputSectionProps) => {
  // const { createChat } = useCreateChat()
  const handleSubmit = async (mainPrompt: string) => {
    try {
      const chat = await createChatPrompt(mainPrompt)

      // router.push(getChatUrl(chat.uniqueKey))
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

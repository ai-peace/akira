'use client'
import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatBubble, ChatBubbleAvatar } from '@/components/ui/chat/chat-bubble'
import { ChatBubbleMessage } from '@/components/ui/chat/chat-bubble'
import { ChatInput } from '@/components/ui/chat/chat-input'
import { ChatMessageList } from '@/components/ui/chat/chat-message-list'
import { ProductEntity } from '@/domains/entities/product.entity'
import { useChat } from '@/hooks/resources/chats/useChat'
import { FC } from 'react'

type Props = {
  chatUniqueKey: string
}

const Component: FC<Props> = ({ chatUniqueKey }) => {
  const { chat, chatError, chatIsLoading, chatErrorType } = useChat({ uniqueKey: chatUniqueKey })

  if (chatIsLoading) return <div>Loading...</div>
  if (!chat) return <div>Chat not found</div>
  if (chatError) return <div>Error: {chatError.message}</div>

  return (
    <>
      {/* <div>{chat?.uniqueKey}</div> */}
      {/* <div>{chat?.mdxContent}</div> */}
      {/* <div>{chat?.prompts?.[0]?.mainPrompt}</div>
      <hr />
      <hr />
      <div>
        {products.map((product) => (
          <div key={product.title}>
            <div>{product.title}</div>
            <div>{product.price}</div>
            <div>{product.priceWithTax}</div>
            <div>{product.condition}</div>
            <div>{product.description}</div>
          </div>
        ))}
      </div> */}
      <div className="mx-auto flex flex-1 gap-4 text-base md:max-w-3xl md:gap-5 lg:max-w-[40rem] lg:gap-6 xl:max-w-[48rem]">
        <ChatMessageList>
          {chat.prompts?.map((prompt) => (
            <>
              <ChatBubble variant="sent">
                <ChatBubbleAvatar fallback="Y" />
                <ChatBubbleMessage variant="sent">{prompt.mainPrompt}</ChatBubbleMessage>
              </ChatBubble>
              {/* 分岐とする */}
              {prompt.resultType === 'RARE_ITEM_SEARCH' && (
                <ChatBubbleProduct products={prompt.result} />
              )}
              {/* <ChatBubble variant="received">
                <ChatBubbleAvatar fallback="AI" />
                <ChatBubbleMessage variant="received">
                  {JSON.stringify(prompt.result)}
                </ChatBubbleMessage>
              </ChatBubble> */}
            </>
          ))}
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
        {/* <ChatInput /> */}
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
                <div className="mt-2 text-sm text-red-500">${Math.round(product.price / 150)}</div>
              </div>
            </Card>
          </>
        ))}
      </div>
    </ChatBubble>
  )
}

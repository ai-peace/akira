import ETypewriterText from '@/components/01_elements/ETypewriterText'
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble'
import { ProductEntity } from '@/domains/entities/product.entity'
import { FC } from 'react'
import { OChatProducts } from '../OChatProducts'

type Props = {
  products: ProductEntity[]
  message: string
}

const Component: FC<Props> = ({ products, message }) => {
  return (
    <>
      <ChatBubble variant="received">
        <ChatBubbleAvatar fallback="AI" src="/images/picture/picture_akira-kun.png" />
        <ChatBubbleMessage variant="received" className="text-sm md:text-base">
          <ETypewriterText text={message} delay={200} />
        </ChatBubbleMessage>
      </ChatBubble>

      <OChatProducts products={products} />
    </>
  )
}

export { Component as OChatBubbleProduct }

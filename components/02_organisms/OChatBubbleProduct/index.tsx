import ETypewriterText from '@/components/01_elements/ETypewriterText'
import OProductListItem from '@/components/02_organisms/OProductListItem'
import { OProductListModal } from '@/components/02_organisms/OProductListModal'
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble'
import { ProductEntity } from '@/domains/entities/product.entity'
import { FC, useState } from 'react'

type Props = {
  products: ProductEntity[]
  message: string
}

const Component: FC<Props> = ({ products, message }) => {
  const [showModal, setShowModal] = useState(false)
  const [displayCount] = useState(8)

  const handleShowMore = () => {
    setShowModal(true)
  }

  return (
    <>
      <ChatBubble variant="received">
        <ChatBubbleAvatar fallback="AI" src="/images/picture/picture_akira-kun.png" />
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
            View all ({products.length} items)
          </button>
        </div>
      )}

      <OProductListModal showModal={showModal} setShowModal={setShowModal} products={products} />
    </>
  )
}

export { Component as OChatBubbleProduct }

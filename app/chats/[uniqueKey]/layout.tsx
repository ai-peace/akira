import { clientApplicationProperties } from '@/consts/client-application-properties'
import { chatRepository } from '@/repository/chat.repository'
import { Metadata } from 'next'

type Props = {
  params: { uniqueKey: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // チャットデータを取得
    const chat = await chatRepository.get(params.uniqueKey)
    console.log('chat!----------', chat)

    if (!chat) {
      return {
        title: 'Chat Not Found | AKIRA',
        description:
          'This chat session is no longer available. Start a new conversation to discover rare Japanese items.',
      }
    }

    return {
      title: chat.title || 'Chat',
      description: `Discover unique Japanese items with AKIRA - Your AI guide to finding rare and exclusive products from Japan.`,
      openGraph: {
        title: `${chat.title || 'Chat'} | AKIRA`,
        description: `Exploring ${chat.title || 'Japanese treasures'} with AKIRA - Your AI companion for discovering rare and exclusive items from Japan.`,
        type: 'website',
        url: `${clientApplicationProperties.appUrl}/chats/${params.uniqueKey}`,
        images: [
          {
            url: `${clientApplicationProperties.appUrl}/images/ogp/ogp_twitterCard_default.jpg`,
            width: 1200,
            height: 630,
            alt: 'AKIRA - Your AI Guide to Rare Japanese Items',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${chat.title || 'Chat'} | AKIRA`,
        description: `Exploring ${chat.title || 'Japanese treasures'} with AKIRA - Your AI companion for discovering rare and exclusive items from Japan.`,
        images: [`${clientApplicationProperties.appUrl}/images/ogp/ogp_twitterCard_default.jpg`],
      },
    }
  } catch (error) {
    // エラー時はデフォルトのメタデータを返す
    return {
      title: 'Chat | AKIRA',
      description:
        'Connect with AKIRA AI to discover rare and exclusive items from Japan. Your personal guide to unique Japanese products.',
    }
  }
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

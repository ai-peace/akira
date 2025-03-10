import { chatRepository } from '@/repository/chat.repository'
import { Metadata, ResolvingMetadata } from 'next'
import { clientApplicationProperties } from '@/consts/client-application-properties'

type Props = {
  params: { uniqueKey: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  try {
    // チャットデータを取得
    const chat = await chatRepository.get(params.uniqueKey)

    if (!chat) {
      return {
        title: 'Chat Not Found | Akira',
        description:
          'This chat session is no longer available. Start a new conversation to discover rare Japanese items.',
      }
    }

    // チャットのタイトルを使用してメタデータを生成
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined'
        ? window.location.origin
        : 'https://jp-rare-items-production.up.railway.app')

    return {
      title: chat.title || 'Chat',
      description: `Discover unique Japanese items with Akira - Your AI guide to finding rare and exclusive products from Japan.`,
      openGraph: {
        title: `${chat.title || 'Chat'} | Akira`,
        description: `Exploring ${chat.title || 'Japanese treasures'} with Akira - Your AI companion for discovering rare and exclusive items from Japan.`,
        type: 'website',
        url: `${baseUrl}/chats/${params.uniqueKey}`,
        images: [
          {
            url: `${baseUrl}/images/ogp/ogp_twitterCard_default.jpg`,
            width: 1200,
            height: 630,
            alt: 'Akira - Your AI Guide to Rare Japanese Items',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${chat.title || 'Chat'} | Akira`,
        description: `Exploring ${chat.title || 'Japanese treasures'} with Akira - Your AI companion for discovering rare and exclusive items from Japan.`,
        images: [`${baseUrl}/images/ogp/ogp_twitterCard_default.jpg`],
      },
    }
  } catch (error) {
    // エラー時はデフォルトのメタデータを返す
    return {
      title: 'Chat | Akira',
      description:
        'Connect with Akira AI to discover rare and exclusive items from Japan. Your personal guide to unique Japanese products.',
    }
  }
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

'use client'

import { OChatList } from '@/components/02_organisms/OChatList'
import { OUserProfile } from '@/components/02_organisms/OUserProfile'
import { OUserPromptUsage } from '@/components/02_organisms/OUserPromptUsage'
import { OWalletConnectButton } from '@/components/02_organisms/OWalletConnectButton'
import { useChats } from '@/hooks/resources/chats/useChats'
import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { leftMenuVisibleAtom } from '@/store/atoms/menuAtoms'
import { useAtom } from 'jotai'
import { PanelLeftCloseIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

const Component = () => {
  const { userPrivate } = useUserPrivate()
  const [isVisible, setIsVisible] = useAtom(leftMenuVisibleAtom)
  const [isMobile, setIsMobile] = useState(false)

  // 画面サイズの変更を検知
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768) // 768px未満をモバイルとみなす
    }

    // 初期チェック
    checkIfMobile()

    // リサイズイベントのリスナーを追加
    window.addEventListener('resize', checkIfMobile)

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  const { chats, chatsIsLoading, chatsError } = useChats()

  // 表示されていない場合は何も表示しない
  if (!isVisible) return null

  // モバイル表示の場合はDrawerとして表示
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-50"
        onClick={() => setIsVisible(false)}
      >
        <div
          className="animate-slide-in-left absolute left-0 h-full w-[320px] bg-background-soft"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky left-0 top-0 z-10 flex h-12 w-full items-center justify-between bg-background-soft px-4">
            <div className="text-lg font-medium">メニュー</div>
            <button
              onClick={() => setIsVisible(false)}
              className="rounded-md p-2 hover:bg-background-muted"
              aria-label="閉じる"
            >
              <PanelLeftCloseIcon className="h-5 w-5 text-foreground" />
            </button>
          </div>
          <div className="relative mt-0 h-full w-full flex-grow overflow-x-hidden">
            {userPrivate && !chatsIsLoading && !chatsError && chats && (
              <div className="h-full overflow-x-auto overflow-y-auto px-4 py-3">
                <OChatList chats={chats} />
              </div>
            )}
            {!userPrivate && (
              <div className="flex h-full flex-col items-center justify-center p-4">
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  When you login, your chat history will be saved.
                </p>
                <OWalletConnectButton className="w-full" />
              </div>
            )}
          </div>
          {userPrivate && (
            <div className="sticky bottom-0 left-0 right-0 mt-auto bg-background-soft px-4 py-4">
              <div className="flex flex-col gap-4">
                <OUserPromptUsage />
                <OUserProfile />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // デスクトップ表示
  return (
    <div className="relative flex h-full w-[320px] flex-col overflow-y-scroll border-border-subtle bg-background-soft">
      {userPrivate && (
        <>
          <div className="relative mt-0 h-full w-full flex-grow overflow-x-hidden">
            {!chatsIsLoading && !chatsError && chats && (
              <div className="h-full overflow-x-auto overflow-y-auto px-4 py-3">
                <OChatList chats={chats} />
              </div>
            )}
          </div>
          <div className="sticky bottom-0 left-0 right-0 mt-auto bg-background-soft px-4 py-4">
            <div className="flex flex-col gap-4">
              <OUserPromptUsage />
              <OUserProfile />
            </div>
          </div>
        </>
      )}
      {!userPrivate && (
        <div className="flex h-full flex-col items-center justify-center p-4">
          <p className="mb-4 text-center text-sm text-muted-foreground">
            When you login, your chat history will be saved.
          </p>
          <OWalletConnectButton className="w-full" />
        </div>
      )}
    </div>
  )
}

export { Component as TLeftMenu }

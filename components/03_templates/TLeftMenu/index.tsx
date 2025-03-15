'use client'

import { OChatList } from '@/components/02_organisms/OChatList'
import { OUserProfile } from '@/components/02_organisms/OUserProfile'
import { OUserPromptUsage } from '@/components/02_organisms/OUserPromptUsage'
import { OWalletConnectButton } from '@/components/02_organisms/OWalletConnectButton'
import { useChats } from '@/hooks/resources/chats/useChats'
import { useUserPrivate } from '@/hooks/resources/user-private/useUserPrivate'
import { leftMenuVisibleAtom } from '@/store/atoms/menuAtoms'
import { useAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'

const Component = () => {
  const { userPrivate } = useUserPrivate()
  const [isVisible, setIsVisible] = useAtom(leftMenuVisibleAtom)
  const [isMobile, setIsMobile] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef(0)
  const drawerRef = useRef<HTMLDivElement>(null)

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

  // ドラッグ処理
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true)
    if ('touches' in e) {
      startYRef.current = e.touches[0].clientY
    } else {
      startYRef.current = e.clientY
    }
  }

  const handleDrag = (e: TouchEvent | MouseEvent) => {
    if (!isDragging) return

    let currentY: number
    if ('touches' in e) {
      currentY = e.touches[0].clientY
    } else {
      currentY = e.clientY
    }

    const deltaY = currentY - startYRef.current

    if (deltaY > 0) {
      // 下方向へのドラッグのみ処理
      if (drawerRef.current) {
        const newHeight = Math.max(0, window.innerHeight * 0.8 - deltaY)
        drawerRef.current.style.height = `${newHeight}px`
      }
    }
  }

  const handleDragEnd = (e: TouchEvent | MouseEvent) => {
    setIsDragging(false)

    let currentY: number
    if ('touches' in e) {
      currentY = e.changedTouches[0].clientY
    } else {
      currentY = e.clientY
    }

    const deltaY = currentY - startYRef.current

    // 一定以上ドラッグしたら閉じる
    if (deltaY > window.innerHeight * 0.2) {
      setIsVisible(false)
    } else {
      // 元に戻す
      if (drawerRef.current) {
        drawerRef.current.style.height = '80vh'
      }
    }
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag)
      window.addEventListener('touchmove', handleDrag)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchend', handleDragEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleDrag)
      window.removeEventListener('touchmove', handleDrag)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging])

  const { chats, chatsIsLoading, chatsError } = useChats()

  // 表示されていない場合は何も表示しない
  if (!isVisible) return null

  // モバイル表示の場合はDrawerとして表示（下からスライドイン）
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-50"
        onClick={() => setIsVisible(false)}
      >
        <div
          ref={drawerRef}
          className="absolute bottom-0 left-0 right-0 h-[80vh] animate-slide-in-bottom rounded-t-xl bg-background-soft"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="sticky left-0 top-0 z-10 flex h-12 w-full flex-col items-center justify-center bg-background-soft px-4"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className="flex w-full flex-col items-center py-2">
              <div className="h-1.5 w-16 cursor-grab rounded-full bg-border active:cursor-grabbing"></div>
            </div>
          </div>
          <div className="relative mt-0 h-[calc(80vh-3rem)] w-full overflow-y-auto overflow-x-hidden">
            {userPrivate && !chatsIsLoading && !chatsError && chats && (
              <div className="flex min-h-full flex-col px-4 py-3">
                <OChatList chats={chats} onChatSelect={() => setIsVisible(false)} />
              </div>
            )}
            {!userPrivate && (
              <div className="flex h-full flex-col items-center justify-center p-4">
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  ログインするとチャット履歴が保存されます
                </p>
                <OWalletConnectButton className="w-full" />
              </div>
            )}
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
              <div className="flex h-full min-h-full flex-col overflow-x-auto overflow-y-auto px-4 py-3">
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
            ログインするとチャット履歴が保存されます
          </p>
          <OWalletConnectButton className="w-full" />
        </div>
      )}
    </div>
  )
}

export { Component as TLeftMenu }

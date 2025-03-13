'use client'

import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { OWalletConnectButton } from '../OWalletConnectButton'
import { useAtom } from 'jotai'
import { leftMenuVisibleAtom } from '@/store/atoms/menuAtoms'
import { useEffect, useState } from 'react'

export const OBottomLoginButton = () => {
  const { userPrivate } = useUserPrivate()
  const [leftMenuVisible] = useAtom(leftMenuVisibleAtom)
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

  // ログイン済みの場合は表示しない
  if (userPrivate) return null

  // モバイルでメニューが開いている場合は表示しない
  if (isMobile && leftMenuVisible) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transform">
      <div className="rounded-full bg-primary p-1 shadow-lg">
        <OWalletConnectButton className="w-[200px]" />
      </div>
    </div>
  )
}

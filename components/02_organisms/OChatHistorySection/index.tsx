'use client'

import { FC, useEffect, useRef, useState } from 'react'

type Props = {
  chat: any
  currentPromptId: string | null
}

const Component: FC<Props> = ({ chat, currentPromptId }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // メニューの外側をクリックした時に閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      ref={menuRef}
      className="fixed right-0 top-1/2 hidden h-auto w-20 -translate-y-1/2 xl:block"
      onMouseEnter={() => setIsMenuOpen(true)}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      {/* ミニマルバー表示 */}
      <div className="relative flex flex-col items-end gap-2 px-4">
        {chat.promptGroups?.map((promptGroup: any) => (
          <div
            key={promptGroup.uniqueKey}
            className={`h-4 w-1 cursor-pointer rounded-full transition-all duration-200 ${
              currentPromptId === promptGroup.uniqueKey
                ? 'bg-gray-800'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => {
              const element = document.getElementById(promptGroup.uniqueKey)
              element?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        ))}
      </div>

      {/* ビッグメニュー（オーバーレイ） */}
      <div
        className={`absolute right-4 top-1/2 w-64 -translate-y-1/2 transform overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 ${
          isMenuOpen ? 'visible translate-x-0 opacity-100' : 'invisible translate-x-4 opacity-0'
        }`}
      >
        <div className="max-h-[600px] overflow-y-auto p-4">
          <div className="space-y-1">
            {chat.promptGroups?.map((promptGroup: any) => (
              <div
                key={promptGroup.uniqueKey}
                className={`group cursor-pointer rounded-md p-2 text-xs transition-all ${
                  currentPromptId === promptGroup.uniqueKey
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => {
                  const element = document.getElementById(promptGroup.uniqueKey)
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="truncate">{promptGroup.question}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export { Component as OChatHistorySection }

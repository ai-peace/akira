'use client'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

const Component = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // マウント前は何も表示しない（またはスケルトンを表示）
  if (!mounted) {
    return (
      <button className="group flex w-full cursor-pointer flex-col items-center gap-1 rounded-md p-2 hover:bg-background-muted">
        <div className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      onClick={() => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
      }}
      className="group flex w-full cursor-pointer flex-col items-center gap-1 rounded-md p-2 hover:bg-background-muted"
    >
      {theme === 'dark' ? (
        <>
          <MoonIcon className="h-5 w-5 text-foreground" />
        </>
      ) : (
        <>
          <SunIcon className="h-5 w-5 text-foreground" />
        </>
      )}
    </button>
  )
}

export { Component as OThemeChangeButton }

'use client'
import { SquarePen } from 'lucide-react'
import Link from 'next/link'

const Component = () => {
  return (
    <Link href="/" className="hover:bg-background-muted cursor-pointer gap-1 rounded-md p-2">
      <SquarePen className="h-5 w-5 text-foreground" />
    </Link>
  )
}

export { Component as ONewChatButton }

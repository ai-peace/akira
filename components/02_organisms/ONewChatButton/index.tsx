'use client'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'

const Component = () => {
  return (
    <Link href="/" className="cursor-pointer gap-1 rounded-md p-2 hover:bg-background-muted">
      <PlusCircle className="h-5 w-5 text-foreground" />
    </Link>
  )
}

export { Component as ONewChatButton }

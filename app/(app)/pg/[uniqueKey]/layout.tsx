'use client'

import { ThemeProvider } from 'next-themes'
import '@/styles/globals.css'

export default function PgLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <section className="flex h-screen bg-background-muted">
        <section className="w-full bg-background text-foreground">
          <div className="relative flex h-full">
            <div className="relative flex h-full w-full">{children}</div>
          </div>
        </section>
      </section>
    </ThemeProvider>
  )
}

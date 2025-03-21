import '@/styles/globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <section className="flex min-h-screen w-full bg-background-muted text-foreground">
        {children}
      </section>
    </>
  )
}

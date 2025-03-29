import '@/front/styles/globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <section className="bg-background-muted flex min-h-screen w-full text-foreground">
        {children}
      </section>
    </>
  )
}

import { OBottomLoginButton } from '@/components/02_organisms/OBottomLoginButton'
import { OMainSpaceHeader } from '@/components/02_organisms/OMainSpaceHeader'
import { TLeftMenu } from '@/components/03_templates/TLeftMenu'
import '@/styles/globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <section className="flex h-screen bg-background-muted">
        <section className="w-full bg-background text-foreground">
          <div className="relative flex h-full">
            <TLeftMenu />
            <div className="relative flex h-full w-full">
              <OMainSpaceHeader />
              {children}
            </div>
          </div>
        </section>
      </section>
      <OBottomLoginButton />
    </>
  )
}

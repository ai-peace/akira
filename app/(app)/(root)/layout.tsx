import { OBottomLoginButton } from '@/front/components/02_organisms/OBottomLoginButton'
import { OMainSpaceHeader } from '@/front/components/02_organisms/OMainSpaceHeader'
import { TLeftMenu } from '@/front/components/03_templates/TLeftMenu'
import '@/front/styles/globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <section className="bg-background-muted flex h-[100svh]">
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

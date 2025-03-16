import { FC } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import EDotFont from '@/components/01_elements/EDotFont'

const Component: FC = () => {
  const { connected } = useWallet()

  return (
    <div className="flex flex-col items-center gap-2">
      <EDotFont
        text={connected ? 'Wallet Connected' : 'Connect Your Wallet'}
        animate={true}
        speed={1}
      />
      <WalletMultiButton className="bg-accent-1 hover:bg-accent-1/90" />
    </div>
  )
}

export const OWalletConnect = Component

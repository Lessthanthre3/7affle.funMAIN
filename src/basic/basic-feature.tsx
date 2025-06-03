import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/solana/solana-provider'
import { AppHero } from '@/components/app-hero'
// Removed useBasicProgram import as it's no longer needed
import { BasicProgram } from './basic-ui'
import { RaffleLogo } from '@/components/7affle-logo'
import { AdminDebugConsole } from '@/components/admin-debug-console'

export default function BasicFeature() {
  const { publicKey } = useWallet()
  // Removed programId as it's no longer needed
  const isAdmin = publicKey?.toString() === 'GrDWUZZpCsxXR8qnZXREmE3bDgkQxLG6BHve3NLPbHFR' ||
               publicKey?.toString() === 'ALo5Qhjy46wVCXnD4osQXTq6ufF5MZ9uhxARAy7affLe' ||
               publicKey?.toString() === 'ACZfNEpJUufGH5MhpUAmoNkCRTpP2KkGhZXeNX1q9UXT' ||
               publicKey?.toString() === 'GhSwQL8opHBhE8PNog9ZGbuzTVdhPMEr5JJTHZQ9GRHq'

  return (
    <div>
      {publicKey && <AdminDebugConsole />}
      <AppHero 
        title={
          <div className="flex flex-col items-center gap-4">
            <div className="mb-2"><RaffleLogo size="md" /></div>
            <h1 className="text-4xl md:text-5xl font-audiowide">
              <span className="text-purple-300">7affle</span>
              <span className="text-green-500">.fun</span>
            </h1>
          </div>
        }
        subtitle={'Decentralized raffle platform on Solana'}
      >
        <div className="flex flex-col items-center space-y-4">
          {isAdmin && publicKey && (
            <p className="text-sm text-green-500 font-medium">
              Admin wallet connected - You can create and manage raffles
            </p>
          )}
          {!publicKey && (
            <div className="mt-4 mb-2 flex flex-col items-center">
              <WalletButton className="bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105" />
              <p className="mt-2 text-white text-sm">Connect wallet to participate in raffles</p>
            </div>
          )}
        </div>
      </AppHero>
      {/* Always render BasicProgram regardless of wallet connection status */}
      <BasicProgram isWalletConnected={!!publicKey} isAdmin={isAdmin} />
    </div>
  )
}

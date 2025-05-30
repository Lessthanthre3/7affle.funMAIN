import { useWallet } from '@solana/wallet-adapter-react'
import { ExplorerLink } from '@/components/cluster/cluster-ui'
import { WalletButton } from '@/components/solana/solana-provider'
import { AppHero } from '@/components/app-hero'
import { ellipsify } from '@/lib/utils'
import { useBasicProgram } from './basic-data-access'
import { BasicProgram } from './basic-ui'
import { RaffleLogo } from '@/components/7affle-logo'
import { AdminDebugConsole } from '@/components/admin-debug-console'

export default function BasicFeature() {
  const { publicKey } = useWallet()
  const { programId } = useBasicProgram()
  const isAdmin = publicKey?.toString() === 'GrDWUZZpCsxXR8qnZXREmE3bDgkQxLG6BHve3NLPbHFR' ||
               publicKey?.toString() === 'ALo5Qhjy46wVCXnD4osQXTq6ufF5MZ9uhxARAy7affLe' ||
               publicKey?.toString() === 'ACZfNEpJUufGH5MhpUAmoNkCRTpP2KkGhZXeNX1q9UXT' ||
               publicKey?.toString() === 'GhSwQL8opHBhE8PNog9ZGbuzTVdhPMEr5JJTHZQ9GRHq'

  return publicKey ? (
    <div>
      <AdminDebugConsole />
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
          <p className="text-center mb-2">
            Smart Contract: <ExplorerLink path={`account/${programId}`} label="GUX...7AFFLE" />
          </p>
          {isAdmin && (
            <p className="text-sm text-green-500 font-medium">
              Admin wallet connected - You can create and manage raffles
            </p>
          )}
          <p className="text-sm text-center max-w-lg">
            
          </p>
        </div>
      </AppHero>
      <BasicProgram />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="py-16">
        <div className="text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="mb-4">
              <RaffleLogo size="md" />
            </div>
            <h1 className="text-4xl md:text-5xl font-audiowide mb-6">
              <span className="text-purple-300">7affle</span>
              <span className="text-green-500">.fun</span>
            </h1>
            <p className="text-lg mb-6 text-gray-300">Connect your wallet to participate in Solana raffles</p>
            <WalletButton className="bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105" />
          </div>
        </div>
      </div>
    </div>
  )
}

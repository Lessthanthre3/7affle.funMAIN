import { RaffleLogo } from '@/components/7affle-logo'
import { useBasicProgram } from '@/basic/basic-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/solana/solana-provider'

// Import dashboard components
import { UserProfile } from './user-profile'
import { useWalletInitialized } from '@/components/wallet-initialization-guard'

export default function DashboardFeature() {
  const { programId } = useBasicProgram()
  const { connected, publicKey } = useWallet()
  const isWalletInitialized = useWalletInitialized()
  
  // Check if user is admin (for displaying admin badge)
  const isAdmin = publicKey?.toString() === 'GrDWUZZpCsxXR8qnZXREmE3bDgkQxLG6BHve3NLPbHFR' || 
               publicKey?.toString() === 'ALo5Qhjy46wVCXnD4osQXTq6ufF5MZ9uhxARAy7affLe' ||
               publicKey?.toString() === 'ACZfNEpJUufGH5MhpUAmoNkCRTpP2KkGhZXeNX1q9UXT' ||
               publicKey?.toString() === 'GhSwQL8opHBhE8PNog9ZGbuzTVdhPMEr5JJTHZQ9GRHq'

  return (
    <div className="min-h-[80vh] flex flex-col px-4 py-8 max-w-5xl mx-auto w-full">
      {/* Logo and Title - Always visible */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="mb-2"><RaffleLogo size="md" /></div>
        <h1 className="text-4xl md:text-5xl font-audiowide mb-1">
          <span className="text-purple-300">7affle</span>
          <span className="text-green-500">.fun</span>
        </h1>
        <p className="text-gray-300 text-center mb-1">Decentralized raffle platform on Solana</p>
        
        {programId && (
          <div className="text-center text-sm text-gray-400 mb-1">
            Smart Contract: <span className="font-mono">{programId.toString().slice(0, 3)}...{programId.toString().slice(-6)}</span>
          </div>
        )}
        
        {isAdmin && connected && (
          <div className="text-center text-sm text-green-500 font-medium">
            Admin wallet connected - You can create and manage raffles
          </div>
        )}
      </div>

      {/* Stats now only shown on the /raffles page */}

      {!connected ? (
        // Welcome Screen (when not connected)
        <div className="flex flex-col items-center">
          <div className="max-w-lg text-center mb-8">
            <p className="text-gray-300 mb-4">
              Enter raffles using SOL and win amazing prizes on the first fully on-chain raffle platform.
            </p>
            <p className="text-gray-400 mb-4 text-sm">
              Connect your wallet to see your profile and check out <a href="/raffles" className="text-purple-400 hover:text-purple-300 underline">raffles page</a> for all platform features.
            </p>
            <WalletButton className="bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105" />
          </div>
        </div>
      ) : (
        // User Dashboard (when connected)
        <div className="w-full">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-purple-600/20 p-6">
            {/* Simplified container with just the UserProfile */}
            <UserProfile />
            
            {/* Only show Continue link if wallet is initialized */}
            {isWalletInitialized && (
              <div className="flex justify-center mt-6">
                <a href="/" className="text-sm text-purple-400 hover:text-purple-300 inline-flex items-center gap-1">
                  Continue to raffles <span className="text-xs">→</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { useWallet } from '@solana/wallet-adapter-react'
import { useBasicProgram } from '@/basic/basic-data-access'
import { InitializeUserStats } from './initialize-user-stats'

// No props needed anymore since we removed the welcome banner
export function UserProfile() {
  const { publicKey } = useWallet()
  const { userStats } = useBasicProgram()
  
  // Check if user needs to initialize profile
  const needsInitialization = publicKey && (!userStats || !userStats.isInitialized)
  
  return (
    <div className="space-y-6">
      {/* Show initialization component if needed */}
      {needsInitialization && (
        <InitializeUserStats />
      )}

      {/* User is already initialized, nothing to show here */}
      {!needsInitialization && (
        <div className="h-4"></div>
      )}
    </div>
  )
}


import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useWallet } from '@solana/wallet-adapter-react'
import { useBasicProgram } from '@/basic/basic-data-access'

/**
 * Component that redirects users to the dashboard if their wallet
 * is connected but not initialized.
 */
export function WalletInitializationGuard({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet()
  const { userStats } = useBasicProgram()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Only redirect if wallet is connected but not initialized and not already on dashboard
    if (
      publicKey && // Only apply redirection for connected wallets
      userStats && 
      !userStats.isInitialized && 
      location.pathname !== '/dashboard'
    ) {
      console.log('Wallet not initialized. Redirecting to dashboard...')
      navigate('/dashboard')
    }
    // If no wallet is connected, allow viewing any page without redirection
  }, [publicKey, userStats, navigate, location.pathname])

  return <>{children}</>
}

/**
 * Hook to check if the current wallet is initialized
 */
export function useWalletInitialized(): boolean {
  const { publicKey } = useWallet()
  const { userStats } = useBasicProgram()
  
  // User is initialized if they have a connected wallet AND initialized stats
  return Boolean(publicKey && userStats && userStats.isInitialized)
}

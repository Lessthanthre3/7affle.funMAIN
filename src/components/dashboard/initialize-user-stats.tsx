import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useBasicProgram } from '@/basic/basic-data-access'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { UserPlus, Clock } from 'lucide-react'

export function InitializeUserStats() {
  const { publicKey } = useWallet()
  const { program, provider } = useBasicProgram()
  const [isInitializing, setIsInitializing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Effect to handle countdown after successful initialization
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (isSuccess && countdown === 0) {
      // Redirect to homepage when countdown reaches zero
      window.location.href = '/';
    }
  }, [isSuccess, countdown]);

  const handleInitialize = async () => {
    if (!publicKey || !program || !provider) {
      toast.error('Wallet not connected or program not loaded')
      return
    }

    try {
      setIsInitializing(true);
      
      // Find the PDA for user stats
      const [userStatsPda] = await PublicKey.findProgramAddressSync(
        [Buffer.from('user-stats'), publicKey.toBuffer()],
        program.programId
      );
      
      console.log('Initializing user stats with PDA:', userStatsPda.toBase58());
      
      // Use the direct approach to bypass TypeScript errors
      // @ts-ignore - We need to use the raw method to match Rust's snake_case naming
      const tx = await program.methods.initializeUserStats().accounts({
        // Use snake_case to match the Rust program's account names
        user_stats: userStatsPda,
        user: publicKey,
        systemProgram: SystemProgram.programId,
      }).rpc();

      toast.success('User profile registered!')
      console.log('Transaction signature', tx)
      
      // Start countdown after successful initialization
      setIsSuccess(true);
      setCountdown(3);
    } catch (error) {
      console.error('Error initializing user stats:', error)
      toast.error('Failed to register profile')
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="p-6 space-y-4 bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Welcome to 7affle!</h3>
        <p className="text-gray-200 text-xl mb-2">
          One-time registration required to participate in raffles!
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-purple-300">What does registration do?</h4>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-purple-900/30 p-2 rounded-full mt-0.5">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-300">Creates your on-chain user profile on the Solana blockchain</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-purple-900/30 p-2 rounded-full mt-0.5">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-300">Enables you to buy tickets and participate in all raffles</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-purple-900/30 p-2 rounded-full mt-0.5">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-300">Tracks your statistics for the weekly and monthly exclusive competitions</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-purple-300">Why is a wallet signature needed?</h4>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-purple-900/30 p-2 rounded-full mt-0.5">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-gray-300">Your signature proves ownership of your wallet and secures your profile</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-purple-900/30 p-2 rounded-full mt-0.5">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-300">Creates a Solana account that requires a small amount of SOL for rent (~0.0001 SOL)</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-purple-900/30 p-2 rounded-full mt-0.5">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-gray-300">This is a one-time action and your data is safely stored on-chain, not on our servers</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="flex flex-col items-center justify-center gap-3">
          <Button 
            onClick={handleInitialize} 
            disabled={isInitializing || isSuccess}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-8 py-4 text-white font-medium rounded-lg transition-all flex items-center gap-3 shadow-lg shadow-purple-900/30 hover:shadow-purple-800/40"
            size="lg"
          >
            {isInitializing ? (
              <>
                <Clock className="h-5 w-5 animate-spin" />
                Creating your profile...
              </>
            ) : isSuccess ? (
              <>
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Redirecting in {countdown}...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Register your profile
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

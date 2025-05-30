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
  const [countdown, setCountdown] = useState(0)


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

      // Use the raw rpc method to call the instruction directly
      // In a real implementation, we would pass the referrer to the smart contract
      // @ts-ignore - Intentionally using the raw instruction name
      const tx = await program.rpc.initializeUserStats({
        accounts: {
          userStats: userStatsPda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
          // In a production implementation, we would include:
          // referrer: referrerPubkey (if available)
        },
        signers: []
      });



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
    <div className="p-6 space-y-4 bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg text-center">
      <h3 className="text-lg font-bold text-white">Welcome to 7affle!</h3>
      <p className="text-gray-300">
        To start participating in raffles and track your progress on the leaderboard, 
        you need to register your user profile.
      </p>
      
      <div className="flex justify-center mt-4">
        <Button 
          onClick={handleInitialize} 
          disabled={isInitializing || isSuccess}
          className="bg-purple-700 hover:bg-purple-600 flex items-center gap-2"
        >
          {isInitializing ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : isSuccess ? (
            <>
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
  )
}

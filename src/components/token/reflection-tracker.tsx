import { useWallet } from '@solana/wallet-adapter-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useAnchorProvider } from '@/components/solana/use-anchor-provider'
import { fetchTokenData, generateReflectionData, ReflectionData, claimReflections } from '@/services/token-service'
import { toast } from 'sonner'

export function ReflectionTracker() {
  const { publicKey, connected } = useWallet()
  const provider = useAnchorProvider()
  const walletAddress = publicKey ? publicKey.toString() : ''
  
  const [isClaiming, setIsClaiming] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [reflectionData, setReflectionData] = useState<ReflectionData>({
    balance: '0',
    pendingReflections: '0',
    totalEarned: '0',
    reflectionRate: '0.35% daily',
    estimatedDaily: '0',
    estimatedMonthly: '0'
  })
  
  // Fetch real token data when wallet is connected
  useEffect(() => {
    if (connected && publicKey && provider) {
      fetchTokenData(provider.connection, publicKey)
        .then(({ userBalanceFormatted }) => {
          // Generate reflection data based on the user's balance
          const reflections = generateReflectionData(userBalanceFormatted);
          setReflectionData(reflections);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching token data:', error);
          toast.error('Failed to fetch token data');
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [connected, publicKey, provider])
  
  const handleClaimReflections = async () => {
    if (!provider || !publicKey) {
      toast.error('Wallet not connected');
      return;
    }
    
    setIsClaiming(true);
    
    try {
      // Call the real claimReflections function that initiates a blockchain transaction
      console.log('Initiating reflection claim transaction...');
      const signature = await claimReflections(provider);
      
      console.log('Transaction successful:', signature);
      toast.success(
        <div className="flex flex-col">
          <span>Reflections claimed successfully</span>
          <a 
            href={`https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=${encodeURIComponent(provider.connection.rpcEndpoint)}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            View transaction
          </a>
        </div>
      );
      
      // Allow some time for the transaction to finalize on the blockchain
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh reflection data after claiming
      const { userBalanceFormatted } = await fetchTokenData(provider.connection, publicKey);
      const updatedReflections = generateReflectionData(userBalanceFormatted);
      setReflectionData(updatedReflections);
    } catch (error) {
      console.error('Failed to claim reflections:', error);
      
      // Provide more detailed error message
      if (error instanceof Error) {
        toast.error(`Failed to claim reflections: ${error.message}`);
      } else {
        toast.error('Failed to claim reflections');
      }
    } finally {
      setIsClaiming(false);
    }
  }

  return (
    <Card className="p-6 bg-gray-800/40 border border-gray-700/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Your Reflection Stats</h3>
        <div className="bg-purple-600/30 rounded-full px-3 py-1">
          <span className="text-sm text-purple-200">4% Reflection Rate</span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mb-2"></div>
            <p className="text-gray-400">Loading reflection data...</p>
          </div>
        </div>
      ) : !connected ? (
        <div className="flex justify-center items-center h-48">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Connect your wallet to view your reflection stats</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Your Balance</p>
                <p className="text-white text-2xl font-bold">{reflectionData.balance}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Pending Reflections</p>
                <p className="text-green-400 text-xl font-medium">{reflectionData.pendingReflections}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Total Reflections Earned</p>
                <p className="text-purple-300 font-medium">{reflectionData.totalEarned}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Reflection Rate</p>
                <p className="text-white font-medium">{reflectionData.reflectionRate}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Estimated Daily Reflections</p>
                <p className="text-white font-medium">{reflectionData.estimatedDaily}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Estimated Monthly Reflections</p>
                <p className="text-white font-medium">{reflectionData.estimatedMonthly}</p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-700/50 flex justify-center">
            <Button
              onClick={handleClaimReflections}
              disabled={isClaiming}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6"
            >
              {isClaiming ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Claiming...
                </>
              ) : (
                'Claim Reflections'
              )}
            </Button>
          </div>
        </>
      )}
      
      <p className="mt-4 text-sm text-gray-400 text-center">
        {connected ? (
          <>Wallet <span className="text-purple-400">{walletAddress.substring(0, 4)}...{walletAddress.substring(walletAddress.length - 4)}</span> connected to token contract</>  
        ) : (
          <>Connect your wallet to view reflection data</>  
        )}
      </p>
    </Card>
  )
}

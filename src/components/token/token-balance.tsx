import { useWallet } from '@solana/wallet-adapter-react'
import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { useAnchorProvider } from '@/components/solana/use-anchor-provider'
import { fetchTokenData } from '@/services/token-service'
import { toast } from 'sonner'

export function TokenBalance() {
  const { publicKey, connected } = useWallet()
  const provider = useAnchorProvider()
  const walletAddress = publicKey ? publicKey.toString() : ''
  
  const [isLoading, setIsLoading] = useState(true)
  const [tokenBalance, setTokenBalance] = useState('0')
  
  // Fetch real token data when wallet is connected
  useEffect(() => {
    if (connected && publicKey && provider) {
      fetchTokenData(provider.connection, publicKey)
        .then(({ userBalanceFormatted }) => {
          setTokenBalance(userBalanceFormatted);
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

  return (
    <Card className="p-6 bg-gray-800/40 border border-gray-700/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">$7F Token Balance</h3>
        <div className="bg-green-600/30 rounded-full px-3 py-1">
          <span className="text-sm text-green-200">SPL Token</span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mb-2"></div>
            <p className="text-gray-400">Loading token data...</p>
          </div>
        </div>
      ) : !connected ? (
        <div className="flex justify-center items-center h-48">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Connect your wallet to view your token balance</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-gray-900/60 rounded-lg p-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Your Balance</p>
                <p className="text-white text-4xl font-bold">{tokenBalance}</p>
                <p className="text-purple-300 text-sm mt-2">$7F Token</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/40 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Token Type</p>
                <p className="text-white font-medium">Standard SPL Token</p>
              </div>
              
              <div className="bg-gray-900/40 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Decimals</p>
                <p className="text-white font-medium">9</p>
              </div>
            </div>
          </div>
        </>
      )}
      
      <p className="mt-4 text-sm text-gray-400 text-center">
        {connected ? (
          <>Wallet <span className="text-purple-400">{walletAddress.substring(0, 4)}...{walletAddress.substring(walletAddress.length - 4)}</span> connected</>  
        ) : (
          <>Connect your wallet to view token data</>  
        )}
      </p>
    </Card>
  )
}

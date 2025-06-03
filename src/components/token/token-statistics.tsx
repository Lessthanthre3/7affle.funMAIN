import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { fetchTokenStats, TokenStats } from '@/services/token-service'
import { toast } from 'sonner'
import { Connection } from '@solana/web3.js'
import { ENV } from '@/lib/environment'

export function TokenStatistics() {
  const { connected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null)
  const [lastRefreshTime, setLastRefreshTime] = useState(0)
  
  // Fetch token stats with debounce protection
  useEffect(() => {
    const fetchStats = async () => {
      // Prevent excessive refreshes
      const now = Date.now()
      if (now - lastRefreshTime < 10000) { // 10 second cooldown
        return
      }
      
      if (!connected) {
        return
      }
      
      setLoading(true)
      setLastRefreshTime(now)
      
      try {
        // Create a new connection
        const connection = new Connection(ENV.rpcEndpoint, 'confirmed')
        
        // Fetch token stats with the connection
        const stats = await fetchTokenStats(connection)
        setTokenStats(stats)
      } catch (error) {
        console.error('Error fetching token stats:', error)
        toast.error('Failed to load token statistics')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
    
    // Refresh every 2 minutes
    const interval = setInterval(() => {
      fetchStats()
    }, 120000)
    
    return () => clearInterval(interval)
  }, [connected, lastRefreshTime])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {loading ? (
        // Loading state
        <div className="col-span-2 p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-400">Loading token statistics...</p>
        </div>
      ) : (
        // Data display
        <>
          <Card className="p-4 bg-gray-800/40 border border-gray-700/50">
            <h3 className="text-lg font-medium text-white mb-4">Supply & Distribution</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Supply:</span>
                <span className="text-white font-medium">{tokenStats?.totalSupplyFormatted || '0'} $7F</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Circulating Supply:</span>
                <span className="text-white font-medium">{tokenStats?.circulatingSupplyFormatted || '0'} $7F</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Holders:</span>
                <span className="text-white font-medium">{tokenStats?.holders || '0'}</span>
              </div>
            </div>
          </Card>

          {/* Market data removed - will be handled by Dexscreener when token is live */}
          
          {/* Treasury section removed for security reasons */}
          
          <Card className="p-4 bg-gray-800/40 border border-gray-700/50">
            <h3 className="text-lg font-medium text-white mb-4">Token Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Token Type:</span>
                <span className="text-white font-medium">Standard SPL Token</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Token Decimals:</span>
                <span className="text-white font-medium">9</span>
              </div>
              <div className="pt-2">
                <p className="text-sm text-gray-400">
                  $7F is a standard SPL token with no additional fees or reflection mechanics.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

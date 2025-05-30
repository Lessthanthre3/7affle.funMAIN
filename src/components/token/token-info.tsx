// React is automatically imported with JSX in React 17+
import { useWallet } from '@solana/wallet-adapter-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import logoImg from '@/images/F7logo2.png'

// Import Card directly with relative path to avoid path alias issues
import { Card } from '../../components/ui/card'

export function TokenInfo() {
  const { connected } = useWallet()
  const navigate = useNavigate()

  if (!connected) {
    return (
      <div className="max-w-6xl mx-auto py-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Connect your wallet to view Token Info</h2>
        <p className="text-gray-400 mb-8">You need to connect your Solana wallet to access this page.</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    )
  }

  return (
    <section className="max-w-6xl mx-auto py-10 px-4 bg-gradient-to-b from-gray-950 to-black">
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-purple-900/50 rounded-lg p-6 shadow-lg border border-purple-700/30">
          <h2 className="text-2xl font-bold mb-2">
            <span className="text-white">7affle</span>
            <span className="text-green-500">.fun</span>
            <span className="ml-2 text-white">Token Info</span>
          </h2>
          <p className="text-gray-200">
            Learn about the $7F token and its benefits
          </p>
        </div>

        <Card className="p-6 bg-gray-800/60 border border-gray-700/50 text-center">
          <div className="flex items-center justify-center mb-6">
            <img src={logoImg} alt="$7F Token" className="h-16 w-auto mr-4" />
            <div>
              <h3 className="text-2xl font-bold text-white">$7F Token</h3>
              <p className="text-gray-300">The native token of the 7affle.fun platform</p>
            </div>
          </div>
          
          <div className="bg-purple-900/30 rounded-lg p-8 border border-purple-800/30">
            <h4 className="text-xl font-semibold text-white mb-4">Coming Soon</h4>
            <p className="text-gray-200 max-w-2xl mx-auto">
              We're finalizing our tokenomics and will update this page with complete information soon. 
              The $7F token will power the 7affle.fun platform and provide holders with exclusive benefits and rewards.
            </p>
            
            <div className="mt-8">
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white" 
                onClick={() => navigate('/raffles')}
              >
                Explore Raffles
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}

// React is automatically imported with JSX in React 17+
import { useWallet } from '@solana/wallet-adapter-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import logoImg from '@/images/F7logo2.png'
import { TokenBalance } from './token-balance'

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
    <section className="max-w-3xl mx-auto py-12 px-6 bg-gradient-to-b from-gray-900 to-black">
      {/* Header with animated gradient border */}
      <div className="mb-8 rounded-xl p-0.5 bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg">
        <div className="bg-gray-900 rounded-lg p-6 backdrop-blur-sm flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md"></div>
              <img src={logoImg} alt="$7F Logo" className="h-12 w-auto relative" />
            </div>
            <div className="ml-4">
              <h2 className="text-3xl font-bold flex items-center">
                <span className="text-white">$7F</span>
                <span className="ml-2 text-green-500">Token</span>
              </h2>
              <p className="text-gray-300 mt-1">
                The official token powering the 7affle.fun ecosystem
              </p>
            </div>
          </div>
          <div className="mt-6 md:mt-0">
            <div className="bg-gray-800/60 rounded-full py-2 px-4 border border-green-500/30 shadow-lg shadow-green-500/10">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse mr-2"></div>
                <span className="text-green-400 font-medium">Live Token</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Balance */}
      <div className="mb-8">
        <div className="bg-gray-800/20 rounded-xl p-0.5 bg-gradient-to-r from-blue-700/50 to-purple-700/50 shadow-xl">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg overflow-hidden">
            <TokenBalance />
          </div>
        </div>
      </div>
      
      
      {/* Tokenomics */}
      <div className="mb-8">
        <div className="bg-gray-800/20 rounded-xl p-0.5 bg-gradient-to-br from-purple-700/50 via-indigo-700/50 to-blue-700/50 shadow-xl">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="bg-purple-600/20 p-1.5 rounded-md mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </span>
              Tokenomics
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-800/20 p-4 rounded-lg border-l-4 border-purple-500">
                <h4 className="text-lg font-medium text-purple-300 mb-3">Token Specification</h4>
                <ul className="space-y-3">
                  <li className="flex items-center bg-gray-800/30 p-2 rounded-md">
                    <div className="w-2 h-2 rounded-full bg-green-400 mr-3"></div>
                    <span className="text-green-300">Fixed supply: 1,000,000,000 tokens</span>
                  </li>
                  <li className="flex items-center bg-gray-800/30 p-2 rounded-md">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mr-3"></div>
                    <span className="text-purple-300">Standard SPL token on Solana</span>
                  </li>
                  <li className="flex items-center bg-gray-800/30 p-2 rounded-md">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mr-3"></div>
                    <span className="text-blue-300">No taxes or fees on transfers</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Token Contract Info */}
      <div className="text-center">
        <div className="inline-flex items-center bg-gray-800/30 rounded-full px-4 py-2 border border-gray-700/30">
          <span className="text-xs text-gray-400 mr-2">Token contract:</span>
          <span className="text-xs font-mono text-purple-300">Coming soon!</span>
        </div>
      </div>
    </section>
  )
}

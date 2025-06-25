import { useWallet } from '@solana/wallet-adapter-react'
import { useState, useEffect } from 'react'
import { useBasicProgram } from '../basic/basic-data-access'
import { ClusterUiSelect } from './cluster/cluster-ui'
import { useCluster } from './cluster/cluster-data-access'

// Admin wallet addresses that are authorized to see the debug console
const ADMIN_WALLETS = [
  'GrDWUZZpCsxXR8qnZXREmE3bDgkQxLG6BHve3NLPbHFR',
  'ALo5Qhjy46wVCXnD4osQXTq6ufF5MZ9uhxARAy7affLe',
  'ACZfNEpJUufGH5MhpUAmoNkCRTpP2KkGhZXeNX1q9UXT',
  'GhSwQL8opHBhE8PNog9ZGbuzTVdhPMEr5JJTHZQ9GRHq'
]

// Connection errors store
interface ConnectionError {
  id: string
  message: string
  timestamp: Date
  clusterName: string
  type: 'connection' | 'account'
}

const connectionErrors: ConnectionError[] = []

// Function to add connection errors (exported for use in other components)
export function addConnectionError(clusterName: string, error: string, type: 'connection' | 'account' = 'connection') {
  const errorEntry: ConnectionError = {
    id: Date.now().toString(),
    message: error,
    timestamp: new Date(),
    clusterName,
    type
  }
  connectionErrors.unshift(errorEntry)
  // Keep only the last 10 errors
  if (connectionErrors.length > 10) {
    connectionErrors.splice(10)
  }
}

interface DebugConsoleProps {
  className?: string
}

export function AdminDebugConsole({ className = '' }: DebugConsoleProps) {
  const { publicKey } = useWallet()
  const { programId } = useBasicProgram()
  const { cluster } = useCluster()
  const [isExpanded, setIsExpanded] = useState(false)
  const [errors, setErrors] = useState<ConnectionError[]>([])

  // Update errors periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setErrors([...connectionErrors])
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Only show to admin wallets
  if (!publicKey || !ADMIN_WALLETS.includes(publicKey.toBase58())) {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div 
        className="flex justify-end mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="bg-gray-800 text-white px-3 py-1 rounded-md text-xs hover:bg-gray-700 transition-colors">
          {isExpanded ? 'Hide Debug Console' : 'Show Debug Console'}
          {errors.length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded">
              {errors.length}
            </span>
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="bg-gray-800 border border-gray-700 rounded-md p-4 w-96 max-w-full shadow-xl max-h-96 overflow-y-auto">
          <h3 className="text-white text-sm font-bold mb-2 border-b border-gray-700 pb-2">
            Admin Debug Console
          </h3>
          
          {/* Cluster Selection */}
          <div className="mb-4">
            <h4 className="text-gray-400 text-xs font-semibold mb-2">Cluster:</h4>
            <ClusterUiSelect />
          </div>
          
          {/* Connection Errors Section */}
          {errors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-red-400 text-xs font-semibold mb-2">System Errors:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {errors.map((error) => (
                  <div key={error.id} className="bg-red-900/20 border border-red-800 rounded p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="text-red-400 font-mono">{error.message}</div>
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        error.type === 'connection' ? 'bg-blue-800 text-blue-200' : 'bg-yellow-800 text-yellow-200'
                      }`}>
                        {error.type}
                      </span>
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {error.clusterName} - {error.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-gray-300 text-xs space-y-2">
            <p>Decentralized raffle platform on Solana with transparent winner selection</p>
            
            <div className="flex">
              <span className="text-gray-500 mr-2">Program ID:</span>
              <code className="font-mono text-purple-400">{programId.toString().slice(0, 3)}...{programId.toString().slice(-6)}</code>
            </div>
            
            <div className="bg-green-900/20 border border-green-800 rounded p-2 mt-2">
              <span className="text-green-400 text-xs">Admin wallet connected - You can create and manage raffles</span>
            </div>
            
            <p className="text-gray-400 mt-2">
              
            </p>
            
            <div className="mt-2 border-t border-gray-700 pt-2">
              <h4 className="text-gray-400 text-xs mb-1">Additional Debug Data:</h4>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-gray-500">Admin Wallets:</div>
                <div className="text-purple-400 font-mono text-xs truncate">{ADMIN_WALLETS[0]}</div>
                <div className="text-gray-500">Current Network:</div>
                <div className="text-purple-400">{cluster.name}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

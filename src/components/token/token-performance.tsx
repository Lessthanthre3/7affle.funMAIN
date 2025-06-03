import { useState } from 'react'
import { TokenStatistics } from './token-statistics'
import { TransactionHistory } from './transaction-history'

export function TokenPerformance() {
  const [activeTab, setActiveTab] = useState<'statistics' | 'transactions'>('statistics')

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Token Performance</h2>
      
      <div className="rounded-lg overflow-hidden">
        {/* Tab navigation */}
        <div className="flex">
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'statistics'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('statistics')}
          >
            Statistics
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'transactions'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
        </div>

        {/* Tab content */}
        <div className="p-1 bg-gray-800/40 border border-gray-700/50 rounded-b-lg">
          {activeTab === 'statistics' ? (
            <TokenStatistics />
          ) : (
            <TransactionHistory />
          )}
        </div>
      </div>
    </div>
  )
}

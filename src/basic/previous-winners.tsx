import { useBasicProgram } from './basic-data-access'
import { useState, useEffect } from 'react'
import { ellipsify } from '@/lib/utils'
import { ExplorerLink } from '@/components/explorer-link'

interface WinnerData {
  raffleAddress: string
  raffleName: string
  winnerAddress: string
  ticketNumber: number
  prizeAmount: number
  endTimestamp: number
  transactionSignature?: string
}

export function PreviousWinners() {
  const { activeRaffles, fetchRaffles } = useBasicProgram()
  const [winners, setWinners] = useState<WinnerData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (fetchRaffles.isLoading) {
      setIsLoading(true)
      return
    }

    // Filter completed raffles with winners
    const completedRaffles = activeRaffles.filter(raffle => 
      !raffle.isActive && raffle.winner !== null && raffle.winnerAddress !== null
    )

    // Transform raffle data to winner data
    const winnersList = completedRaffles.map(raffle => ({
      raffleAddress: raffle.address.toString(),
      raffleName: raffle.name,
      winnerAddress: raffle.winnerAddress!.toString(), // We've already filtered for non-null
      ticketNumber: raffle.winner!, // We've already filtered for non-null
      prizeAmount: raffle.ticketPrice * raffle.totalTickets * 0.95, // 95% to winner
      endTimestamp: raffle.endTimestamp,
      // In a real implementation, you would store the claim transaction signature
      // This is a placeholder - in production, you'd fetch this from your backend
      transactionSignature: undefined
    }))

    // Sort by end timestamp (most recent first)
    winnersList.sort((a, b) => b.endTimestamp - a.endTimestamp)
    
    setWinners(winnersList)
    setIsLoading(false)
  }, [activeRaffles, fetchRaffles.isLoading])

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <span className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></span>
      </div>
    )
  }

  if (winners.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700/50">
        <div className="max-w-md mx-auto px-6">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">No Winners Yet</h3>
          <p className="text-gray-400">
            No raffles have been completed with winners yet. Check back after some raffles have ended!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
        <h2 className="text-xl font-bold text-white mb-4">Previous Winners</h2>
        <p className="text-gray-400 mb-4">
          View all past raffle winners with complete transaction details for full transparency.
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-800/50 text-gray-300 text-sm">
              <tr>
                <th className="py-3 px-4 text-left">Raffle</th>
                <th className="py-3 px-4 text-left">Winner</th>
                <th className="py-3 px-4 text-left">Ticket #</th>
                <th className="py-3 px-4 text-left">Prize Amount</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((winner, index) => (
                <tr 
                  key={winner.raffleAddress} 
                  className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'}`}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{winner.raffleName}</div>
                    <div className="text-xs text-gray-400">
                      <ExplorerLink 
                        path={`account/${winner.raffleAddress}`}
                        label={ellipsify(winner.raffleAddress)}
                        className="text-purple-400 hover:text-purple-300"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <ExplorerLink 
                        path={`account/${winner.winnerAddress}`}
                        label={ellipsify(winner.winnerAddress)}
                        className="text-yellow-400 hover:text-yellow-300"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-purple-400 font-mono">
                    #{winner.ticketNumber}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-green-400 font-medium">{winner.prizeAmount.toFixed(2)} SOL</span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {new Date(winner.endTimestamp).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {winner.transactionSignature ? (
                      <ExplorerLink 
                        path={`tx/${winner.transactionSignature}`}
                        label="View Transaction"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">Not claimed yet</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-4">
        <div className="flex items-start space-x-4">
          <div className="bg-purple-800/30 p-2 rounded-full">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-white mb-1">About Winner Selection</h3>
            <p className="text-gray-300 text-sm">
              Winners are selected using Solana's on-chain randomness. Prize distribution follows our smart contract rules, with 95% of the total pool going to winners and 5% to the platform for development.
            </p>
            <p className="text-gray-300 text-sm mt-2">
              All transactions are recorded on the Solana blockchain for complete transparency and verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

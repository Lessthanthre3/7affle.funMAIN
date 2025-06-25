import React from 'react'
import { RaffleData, useBasicProgram } from './basic-data-access'
import { getBasicProgramId } from '@project/anchor'
import { useAnchorProvider } from '@/components/solana/use-anchor-provider'
import { useCluster } from '@/components/cluster/cluster-data-access'
import { Cluster } from '@solana/web3.js'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { ellipsify } from '@/lib/utils'
import { toast } from 'sonner'
import { LeaderboardAdmin } from './leaderboard-admin'
import { LayoutGrid, List } from 'lucide-react'

// Admin-only component for managing raffles
export function AdminPanel() {
  const { initializeProgramCounter, activeRaffles, drawWinner, fetchRaffles, cancelRaffle } = useBasicProgram()
  const provider = useAnchorProvider()
  const { cluster } = useCluster()
  const programId = getBasicProgramId(cluster.network as Cluster)
  const { publicKey } = useWallet()
  const [raffles, setRaffles] = useState<RaffleData[]>([])
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed' | 'ended'>('all')
  const [activeSection, setActiveSection] = useState('raffles') // Options: 'raffles', 'leaderboard'
  const [isInitializingCounter, setIsInitializingCounter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const rafflesPerPage = 5
  
  // Only admin can access this panel
  const isAdmin = publicKey?.toString() === 'GrDWUZZpCsxXR8qnZXREmE3bDgkQxLG6BHve3NLPbHFR' ||
               publicKey?.toString() === 'ALo5Qhjy46wVCXnD4osQXTq6ufF5MZ9uhxARAy7affLe' ||
               publicKey?.toString() === 'ACZfNEpJUufGH5MhpUAmoNkCRTpP2KkGhZXeNX1q9UXT' ||
               publicKey?.toString() === 'GhSwQL8opHBhE8PNog9ZGbuzTVdhPMEr5JJTHZQ9GRHq'
  
  useEffect(() => {
    if (!isAdmin) return
    
    // Filter raffles based on selection
    let filteredRaffles = [...activeRaffles]
    
    if (selectedFilter === 'active') {
      filteredRaffles = filteredRaffles.filter(raffle => raffle.isActive)
    } else if (selectedFilter === 'completed') {
      filteredRaffles = filteredRaffles.filter(raffle => !raffle.isActive && raffle.winner !== null)
    } else if (selectedFilter === 'ended') {
      const now = Date.now()
      filteredRaffles = filteredRaffles.filter(raffle => 
        raffle.isActive && now > raffle.endTimestamp && raffle.winner === null
      )
    }
    
    setRaffles(filteredRaffles)
    // Reset to first page when filter changes
    setCurrentPage(1)
  }, [activeRaffles, selectedFilter, isAdmin])
  
  // Handler for canceling a raffle with no tickets
  const handleCancelRaffle = async (raffleAddress: string) => {
    try {
      // Convert string to PublicKey
      await cancelRaffle.mutateAsync({ raffleAddress: new PublicKey(raffleAddress) })
      toast.success('Raffle canceled successfully!')
      // Refresh the raffles list
      fetchRaffles.refetch()
    } catch (error) {
      console.error('Failed to cancel raffle:', error)
      toast.error('Failed to cancel raffle. Make sure no tickets have been sold.')
    }
  }
  
  // Handler for program counter initialization
  const handleInitializeCounter = async () => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return
    }
    
    try {
      setIsInitializingCounter(true)
      await initializeProgramCounter.mutateAsync()
      toast.success('Program counter initialized!')
    } catch (error) {
      console.error('Error initializing program counter:', error)
      toast.error('Failed to initialize program counter')
    } finally {
      setIsInitializingCounter(false)
    }
  }
  
  // Handler for drawing a winner
  const handleDrawWinner = async (raffleAddress: string) => {
    try {
      // Convert string to PublicKey
      await drawWinner.mutateAsync({ raffleAddress: new PublicKey(raffleAddress) })
      toast.success('Winner drawn successfully!')
      // Refresh the raffles list
      fetchRaffles.refetch()
    } catch (error) {
      console.error('Failed to draw winner:', error)
      
      // Check if error message contains information about a winner already being drawn
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('already') || errorMessage.includes('winner')) {
        toast.info('A winner has already been drawn for this raffle. Refreshing to show the winner...')
        // Refresh to show the correct state
        fetchRaffles.refetch()
      } else {
        toast.error('Failed to draw winner. Please try again.')
      }
    }
  }
  
  // Handler for distributing a prize to the winner (placeholder for now)
  const handleDistributePrize = (raffle: RaffleData) => {
    toast.info(`Prize distribution for raffle ${raffle.raffleId} coming soon...`)
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-6 max-w-md mx-auto">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">Admin Access Required</h3>
          <p className="text-gray-300">You need administrator privileges to access this panel.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="mx-auto max-w-screen-xl p-4">
      <h1 className="text-3xl font-bold text-white mb-6">Admin Panel</h1>
      
      {/* Navigation Tabs */}
      <div className="flex space-x-2 mb-6">
        <Button 
          variant={activeSection === 'raffles' ? "default" : "outline"}
          onClick={() => setActiveSection('raffles')}
          className="flex items-center"
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Raffles
        </Button>
        <Button 
          variant={activeSection === 'leaderboard' ? "default" : "outline"}
          onClick={() => setActiveSection('leaderboard')}
          className="flex items-center"
        >
          <List className="h-4 w-4 mr-2" />
          Leaderboard
        </Button>
      </div>

      {/* Raffles Section */}
      {activeSection === 'raffles' && (
        <div>
          <Button 
            onClick={handleInitializeCounter}
            disabled={isInitializingCounter}
            className="mb-4"
          >
            Initialize Program Counter
          </Button>
          
          {raffles.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <p className="text-gray-400">No raffles found matching the selected filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-800/50 text-gray-300">
                  <tr>
                    <th className="py-3 px-4 text-left">Raffle ID</th>
                    <th className="py-3 px-4 text-left">Raffle Name</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Tickets</th>
                    <th className="py-3 px-4 text-left">Prize Pool</th>
                    <th className="py-3 px-4 text-left">Winner</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {raffles
                    .slice((currentPage - 1) * rafflesPerPage, currentPage * rafflesPerPage)
                    .map((raffle, index) => {
                    const now = Date.now()
                    const isEnded = now > raffle.endTimestamp && raffle.isActive
                    const isSoldOut = raffle.totalTickets === raffle.maxTickets
                    // A raffle needs a winner if it's ended OR sold out, AND doesn't have a winner yet
                    const needsWinner = (isEnded || (isSoldOut && !raffle.isActive)) && raffle.winner === null
                    const hasWinner = raffle.winner !== null
                    
                    return (
                      <tr 
                        key={raffle.address.toString()} 
                        className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'}`}
                      >
                        <td className="py-3 px-4">
                          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/30 px-3 py-1.5 rounded-md border border-purple-700/30 inline-block">
                            <span className="text-purple-300 font-mono text-sm">
                              {raffle.raffleId || '---'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-7 h-7 bg-purple-800/30 rounded-full flex items-center justify-center mr-3">
                              <span className="text-purple-400 text-xs font-bold">7F</span>
                            </div>
                            <div>
                              <div className="font-medium text-white">{raffle.name}</div>
                              <div className="text-xs text-gray-400">{ellipsify(raffle.address.toString())}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {raffle.isActive ? (
                            isEnded ? (
                              <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded-full">
                                Ended, No Winner
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full">
                                Active
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded-full">
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white">{raffle.totalTickets} / {raffle.maxTickets}</div>
                          <div className="w-24 bg-gray-700 rounded-full h-1.5 mt-1.5">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-green-500 h-1.5 rounded-full" 
                              style={{ width: `${(raffle.totalTickets / raffle.maxTickets) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white font-medium">
                            {(raffle.ticketPrice * raffle.totalTickets).toFixed(2)}
                          </span>
                          <span className="text-xs text-green-400 ml-1">SOL</span>
                        </td>
                        <td className="py-3 px-4">
                          {hasWinner ? (
                            <div>
                              <div className="text-yellow-400 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                Ticket #{raffle.winner}
                              </div>
                              {raffle.winnerAddress && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {ellipsify(raffle.winnerAddress.toString())}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {needsWinner && (
                              <Button 
                                onClick={() => handleDrawWinner(raffle.address.toString())}
                                disabled={drawWinner.isPending}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                                size="sm"
                              >
                                Draw Winner
                              </Button>
                            )}
                            {hasWinner && (
                              <Button 
                                onClick={() => handleDistributePrize(raffle)}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                size="sm"
                              >
                                Distribute Prize
                              </Button>
                            )}
                           
                            {raffle.totalTickets === 0 && (
                              <Button 
                                onClick={() => handleCancelRaffle(raffle.address.toString())}
                                disabled={cancelRaffle.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4 px-4">
                <div className="text-sm text-gray-400">
                  Showing {Math.min((currentPage - 1) * rafflesPerPage + 1, raffles.length)} to {Math.min(currentPage * rafflesPerPage, raffles.length)} of {raffles.length} raffles
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-purple-700 hover:bg-purple-800 text-white text-xs"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-2 text-white">
                    Page {currentPage} of {Math.ceil(raffles.length / rafflesPerPage) || 1}
                  </div>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(raffles.length / rafflesPerPage)))}
                    disabled={currentPage >= Math.ceil(raffles.length / rafflesPerPage)}
                    className="bg-purple-700 hover:bg-purple-800 text-white text-xs"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Leaderboard Admin Section */}
      {activeSection === 'leaderboard' && <LeaderboardAdmin />}
    </div>
  )
}

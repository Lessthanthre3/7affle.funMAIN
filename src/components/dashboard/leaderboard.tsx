import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { ellipsify } from '@/lib/utils'
import { WinnersDisplay } from './winners-display'
import { useBasicProgram } from '@/basic/basic-data-access'
import { InitializeUserStats } from './initialize-user-stats'

export function Leaderboard() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const { publicKey } = useWallet()
  const { fetchLeaderboard, userStats } = useBasicProgram()
  const userAddress = publicKey?.toString() || ''
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const maxPages = 5 // For weekly, this will show up to 50 participants
  
  // If the user hasn't initialized their stats yet, show the init component
  const showInitialize = publicKey && userStats && !userStats.isInitialized
  
  // Get leaderboard data from the contract
  const { data: leaderboardData, isLoading: isLoadingLeaderboard } = fetchLeaderboard
  
  // Format leaderboard data for display
  const formattedLeaderboard = {
    weekly: leaderboardData?.weekly.map(entry => ({
      address: entry.user.toString(),
      tickets: entry.weeklyTickets
    })) || [],
    monthly: leaderboardData?.monthly.map(entry => ({
      address: entry.user.toString(),
      tickets: entry.monthlyTickets
    })) || []
  }
  
  const currentLeaderboard = formattedLeaderboard[period]
  const userRank = currentLeaderboard.findIndex(entry => entry.address === userAddress)
  
  // Reset to page 1 when switching between weekly/monthly view
  useEffect(() => {
    setCurrentPage(1)
  }, [period])
  
  // Calculate which items to show on the current page
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, currentLeaderboard.length)
  const currentPageData = currentLeaderboard.slice(startIndex, endIndex)
  
  // Get total pages based on data length
  const totalPages = Math.min(
    Math.ceil(currentLeaderboard.length / itemsPerPage),
    maxPages
  )
  
  // Function to change page
  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }
  
  const [activeTab, setActiveTab] = useState<'rankings' | 'winners'>('rankings')

  return (
    <div className="space-y-6">
      {/* Tab Selection */}
      <div className="flex mb-4 border-b border-purple-500/20">
        <button
          className={`px-4 py-2 transition-all border-b-2 ${activeTab === 'rankings' 
            ? 'border-purple-500 text-white font-medium' 
            : 'border-transparent text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('rankings')}
        >
          Exclusive Raffle Rankings
        </button>
        <button
          className={`px-4 py-2 transition-all border-b-2 ${activeTab === 'winners' 
            ? 'border-purple-500 text-white font-medium' 
            : 'border-transparent text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('winners')}
        >
          Past Winners
        </button>
      </div>

      {showInitialize ? (
        <InitializeUserStats />
      ) : activeTab === 'rankings' ? (
        <>
          {/* Leaderboard Header */}
          <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-lg p-6 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <Trophy className="h-8 w-8 text-yellow-400 mr-3" />
                <div>
                  <h2 className="text-xl font-bold text-white">Exclusive Raffle</h2>
                  <p className="text-purple-200">
                    Top participants eligible for prize draws
                  </p>
                </div>
              </div>
              
              <div className="flex bg-black/20 rounded-lg p-1">
                <Button 
                  variant="ghost" 
                  className={`px-4 py-2 rounded-md transition-all ${period === 'weekly' 
                    ? 'bg-purple-700 text-white' 
                    : 'text-purple-200 hover:text-white'}`}
                  onClick={() => setPeriod('weekly')}
                >
                  Weekly
                </Button>
                <Button 
                  variant="ghost" 
                  className={`px-4 py-2 rounded-md transition-all ${period === 'monthly' 
                    ? 'bg-purple-700 text-white' 
                    : 'text-purple-200 hover:text-white'}`}
                  onClick={() => setPeriod('monthly')}
                >
                  Monthly
                </Button>
              </div>
            </div>
          </div>
      
      {/* Your Ranking */}
      <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-white">
              #{userRank > -1 ? userRank + 1 : '—'}
            </div>
            <div className="flex items-center">
              <span className="font-medium text-white mr-2">You</span>
              <span className="text-purple-300 text-sm">{ellipsify(userAddress)}</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-96 h-2 bg-gray-700 rounded-full overflow-hidden mr-3">
              <div 
                className="h-full bg-purple-500" 
                style={{ width: userRank > -1 ? `${((currentLeaderboard[userRank]?.tickets / (currentLeaderboard[0]?.tickets || 1)) * 100)}%` : '0%' }}
              />
            </div>
            <div>
              <span className="text-white font-medium">{userRank > -1 ? currentLeaderboard[userRank]?.tickets : 0} tickets</span>
              {period === 'weekly' && userRank >= 0 && userRank < 50 && (
                <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Eligible for weekly prize!</span>
              )}
              {period === 'monthly' && userRank >= 0 && userRank < 100 && (
                <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Eligible for monthly prize!</span>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* How Prizes Work */}
      <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How Prize Distribution Works</h3>
        
        <div className="bg-black/30 rounded-lg p-5 border border-purple-500/20">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                <h4 className="font-medium text-yellow-400">Weekly Prizes</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="bg-purple-900 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</div>
                  <div>
                    <span className="text-white">Purchase raffle tickets</span>
                    <p className="text-sm text-gray-400">Each ticket gets you entry to both weekly and monthly prize pools</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-purple-900 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</div>
                  <div>
                    <span className="text-white">Reach the top 50 weekly players</span>
                    <p className="text-sm text-gray-400">Based on total tickets purchased during the week</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-purple-900 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</div>
                  <div>
                    <span className="text-white">Chance to win weekly prize</span>
                    <p className="text-sm text-gray-400">One random winner is selected from top 50 players each week</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <Award className="h-5 w-5 text-blue-400 mr-2" />
                <h4 className="font-medium text-blue-400">Monthly Prizes</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="bg-blue-900 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</div>
                  <div>
                    <span className="text-white">Keep participating in raffles</span>
                    <p className="text-sm text-gray-400">All tickets count toward your monthly total</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-900 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</div>
                  <div>
                    <span className="text-white">Reach the top 100 monthly players</span>
                    <p className="text-sm text-gray-400">Based on total tickets purchased during the month</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-900 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</div>
                  <div>
                    <span className="text-white">Chance to win monthly prize</span>
                    <p className="text-sm text-gray-400">One random winner is selected from top 100 players each month</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
            <p className="text-center text-white">🎲 <span className="font-medium">Fair Random Selection:</span> Winners are randomly selected from eligible players, giving everyone an equal chance!</p>
          </div>
        </div>
      </Card>
      
      {/* Top Players */}
      <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {period === 'weekly' ? 'Weekly Exclusive Raffle' : 'Monthly Exclusive Raffle'}
          <span className="text-sm font-normal text-gray-400 ml-2">
            {period === 'weekly' ? '(Top 50 participants eligible)' : '(Top 100 participants eligible)'}
          </span>
        </h3>
        
        {isLoadingLeaderboard ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : currentLeaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No players have purchased tickets yet.</p>
            <p className="mt-2">Be the first to participate!</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {currentPageData.map((player, index) => {
                // Calculate the actual index in the leaderboard
                const actualIndex = startIndex + index
                const isCurrentUser = player.address === userAddress
                
                return (
                  <div 
                    key={player.address} 
                    className={`flex items-center ${isCurrentUser ? 'bg-purple-900/30' : 'bg-black/30'} rounded-lg p-3`}
                  >
                    <div className="flex-shrink-0 w-8 text-center">
                      {actualIndex < 3 ? (
                        <div className="flex justify-center">
                          {actualIndex === 0 && <Trophy className="h-5 w-5 text-yellow-400" />}
                          {actualIndex === 1 && <Trophy className="h-5 w-5 text-gray-400" />}
                          {actualIndex === 2 && <Trophy className="h-5 w-5 text-amber-700" />}
                        </div>
                      ) : (
                        <span className="text-gray-400">#{actualIndex + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex-grow ml-4">
                      <div className="flex items-center">
                        <span className="font-medium text-white mr-2">
                          {isCurrentUser ? 'You' : `Player ${actualIndex + 1}`}
                        </span>
                        <span className="text-purple-300 text-sm">
                          {ellipsify(player.address)}
                        </span>
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-purple-700 text-white px-2 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1 w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500" 
                          style={{ width: `${(player.tickets / (currentLeaderboard[0]?.tickets || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-4 text-right">
                      <span className="text-white font-medium">{player.tickets}</span>
                      <span className="text-gray-400 ml-1">tickets</span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 border-purple-500/30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => changePage(pageNum)}
                    className={`h-8 w-8 p-0 ${pageNum === currentPage ? 'bg-purple-600' : 'border-purple-500/30'}`}
                  >
                    {pageNum}
                  </Button>
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 border-purple-500/30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
        </>
      ) : (
        <WinnersDisplay />
      )}
    </div>
  )
}



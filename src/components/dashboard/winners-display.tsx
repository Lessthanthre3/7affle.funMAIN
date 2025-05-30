import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Calendar, ExternalLink } from 'lucide-react'
import { ellipsify } from '@/lib/utils'
import { useBasicProgram } from '@/basic/basic-data-access'

// Types for our winners data
interface Winner {
  address: string;
  position: number;
  ticketCount: number;
  prize: number;
  txId?: string;
  timestamp: number;
  distributed: boolean;
}

interface WinnersData {
  period: string; // e.g., "Week 21, 2025" or "May 2025"
  endDate: number; // timestamp
  winners: Winner[];
  totalPrize: number;
}

export function WinnersDisplay() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly')
  const [winnersData, setWinnersData] = useState<WinnersData[]>([])
  const { fetchRaffleHistory } = useBasicProgram()
  
  // Process raffle history into weekly and monthly winners
  useEffect(() => {
    if (!fetchRaffleHistory.data || fetchRaffleHistory.data.length === 0) return
    
    processRaffleHistory(fetchRaffleHistory.data)
  }, [fetchRaffleHistory.data, activeTab])
  
  // Process raffle history into winners data format
  const processRaffleHistory = (historyData: any[]) => {
    if (!historyData || historyData.length === 0) return
    
    // Group completed raffles by week or month
    const periodMap = new Map<string, WinnersData>()
    
    historyData.forEach((history) => {
      const date = new Date(history.endTimestamp)
      let periodKey: string
      let periodLabel: string
      
      if (activeTab === 'weekly') {
        // Get ISO week number and year
        const weekNumber = getWeekNumber(date)
        const year = date.getFullYear()
        periodKey = `${year}-W${weekNumber}`
        periodLabel = `Week ${weekNumber}, ${year}`
      } else {
        // Get month and year
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        const month = date.getMonth()
        const year = date.getFullYear()
        periodKey = `${year}-${month}`
        periodLabel = `${monthNames[month]} ${year}`
      }
      
      // Create or update period data
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          period: periodLabel,
          endDate: date.getTime(),
          winners: [],
          totalPrize: 0
        })
      }
      
      const periodData = periodMap.get(periodKey)!
      
      // Add winner
      periodData.winners.push({
        address: history.winnerAddress.toString(),
        position: periodData.winners.length + 1, // Position based on insertion order
        ticketCount: history.totalTicketsSold,
        prize: history.finalPrizeAmount,
        txId: history.transactionSignature || undefined,
        timestamp: history.claimTimestamp,
        distributed: true
      })
      
      // Update total prize
      periodData.totalPrize += history.finalPrizeAmount
    })
    
    // Convert map to array and sort by endDate (most recent first)
    const sortedData = Array.from(periodMap.values())
      .sort((a, b) => b.endDate - a.endDate)
    
    setWinnersData(sortedData)
  }
  
  // Helper function to get ISO week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }
  
  // Get the position indicator
  const getPositionIndicator = (position: number) => {
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-400" />
    if (position === 2) return <Trophy className="h-5 w-5 text-gray-400" />
    if (position === 3) return <Trophy className="h-5 w-5 text-orange-400" />
    return <span className="text-gray-400 text-sm">#{position}</span>
  }
  
  // Check if we're still loading or have no data
  const isLoading = fetchRaffleHistory.isLoading
  
  return (
    <div className="space-y-6">
      {/* Tab selection */}
      <div className="flex bg-black/20 rounded-lg p-1 mb-6 max-w-xs">
        <Button 
          variant="ghost" 
          className={`px-4 py-2 rounded-md transition-all ${activeTab === 'weekly' 
            ? 'bg-purple-700 text-white' 
            : 'text-purple-200 hover:text-white'}`}
          onClick={() => setActiveTab('weekly')}
        >
          <Trophy className="h-4 w-4 mr-2" />
          Weekly Winners
        </Button>
        <Button 
          variant="ghost" 
          className={`px-4 py-2 rounded-md transition-all ${activeTab === 'monthly' 
            ? 'bg-purple-700 text-white' 
            : 'text-purple-200 hover:text-white'}`}
          onClick={() => setActiveTab('monthly')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Monthly Winners
        </Button>
      </div>
      
      {/* Rewards Info Card */}
      <Card className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-lg border-none shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                {activeTab === 'weekly' ? 'Weekly Prizes' : 'Monthly Prizes'}
              </h2>
              <p className="text-purple-200 max-w-2xl">
                {activeTab === 'weekly' 
                  ? 'Every Sunday at 00:00 (GMT), the top 50 players of the week are entered into a special raffle for a chance to win SOL prizes!'
                  : 'At the end of each month, the top 100 players are eligible for our grand prize pool, with 3 winners sharing the prize!'}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="inline-block px-4 py-2 bg-black/20 rounded-lg">
                <span className="text-xs text-purple-200">NEXT DRAW</span>
                <div className="text-white font-bold">
                  {activeTab === 'weekly'
                    ? 'Sunday, 00:00 GMT'
                    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ', 00:00 GMT'
                  }
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Winners List */}
      {winnersData.length > 0 ? (
        <div className="space-y-6">
          {winnersData.map((period, periodIndex) => (
            <Card key={periodIndex} className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden">
              <CardHeader className="pb-4 border-b border-purple-500/10">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    {activeTab === 'weekly' 
                      ? <Calendar className="h-5 w-5 text-purple-400 mr-2" />
                      : <Calendar className="h-5 w-5 text-blue-400 mr-2" />
                    }
                    {period.period}
                  </div>
                  <div className="text-sm text-green-400">
                    {period.totalPrize.toFixed(2)} SOL Prize Pool
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {period.winners.map((winner, winnerIndex) => (
                  <div 
                    key={winnerIndex} 
                    className={`p-4 ${winnerIndex < period.winners.length - 1 ? 'border-b border-purple-500/10' : ''}`}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-900/40 rounded-full flex items-center justify-center mr-4">
                        {getPositionIndicator(winner.position)}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                          <div>
                            <div className="flex items-center mb-1">
                              <span className="text-white font-medium mr-2">
                                {winner.position === 1 ? '1st Place' : 
                                 winner.position === 2 ? '2nd Place' : 
                                 winner.position === 3 ? '3rd Place' : 
                                 `${winner.position}th Place`}
                              </span>
                              <span className="text-gray-400 text-sm">
                                ({winner.ticketCount} tickets)
                              </span>
                            </div>
                            <div className="text-gray-400 text-sm font-mono">
                              {ellipsify(winner.address)}
                            </div>
                          </div>
                          <div className="mt-2 md:mt-0 flex items-center">
                            <span className="text-green-400 font-bold text-lg mr-3">
                              {winner.prize.toFixed(2)} SOL
                            </span>
                            {winner.txId && (
                              <a
                                href={`https://solscan.io/tx/${winner.txId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="View transaction"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg">
          <CardContent className="p-6 text-center">
            <div className="py-8">
              <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Winners Yet</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                {activeTab === 'weekly'
                  ? 'The first weekly prize draw will happen this Sunday at 00:00 GMT. Purchase tickets to participate!'
                  : 'The first monthly prize draw will happen at the end of this month. The top 100 players will be eligible for prizes!'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBasicProgram } from './basic-data-access'
import { Trophy, Calendar, Award, Loader2, CircleDollarSign, CoinsIcon } from 'lucide-react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { ellipsify } from '@/lib/utils'
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { toast } from 'sonner'

// Local storage keys - used for persistence of manual edits
const WEEKLY_WINNERS_KEY = '7affle_weekly_winners'
const MONTHLY_WINNERS_KEY = '7affle_monthly_winners'

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

export function LeaderboardAdmin() {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const { fetchLeaderboard } = useBasicProgram()
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly')
  const [leaderboardData, setLeaderboardData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // States for prize distribution
  const [totalPrizeAmount, setTotalPrizeAmount] = useState<number>(0)
  const [isDistributing, setIsDistributing] = useState(false)
  
  // Prize distribution percentages and pool sizes
  const PRIZE_CONFIG = {
    weekly: {
      poolSize: 50,    // Top 50 players qualify
      winners: 1,     // 1 random winner selected
      percentages: [100] // 100% to single winner
    },
    monthly: {
      poolSize: 100,   // Top 100 players qualify
      winners: 3,      // 3 random winners selected
      percentages: [60, 30, 10] // 60/30/10 split
    }
  }
  
  // States for winner management
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [winnerAddress, setWinnerAddress] = useState<string>('')
  const [winnerPosition, setWinnerPosition] = useState<number>(1)
  const [winnerTickets, setWinnerTickets] = useState<number>(0)
  const [winnerPrize, setWinnerPrize] = useState<number>(0)
  const [txId, setTxId] = useState<string>('')
  
  // Get winners data from local storage
  const getWeeklyWinners = (): WinnersData[] => {
    const data = localStorage.getItem(WEEKLY_WINNERS_KEY)
    return data ? JSON.parse(data) : []
  }
  
  const getMonthlyWinners = (): WinnersData[] => {
    const data = localStorage.getItem(MONTHLY_WINNERS_KEY)
    return data ? JSON.parse(data) : []
  }
  
  // Save winners data to local storage
  const saveWeeklyWinners = (data: WinnersData[]) => {
    localStorage.setItem(WEEKLY_WINNERS_KEY, JSON.stringify(data))
  }
  
  const saveMonthlyWinners = (data: WinnersData[]) => {
    localStorage.setItem(MONTHLY_WINNERS_KEY, JSON.stringify(data))
  }
  
  // Generate new period name
  // Get current week number
  const getCurrentWeekNumber = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }
  
  // Get month name
  const getMonthName = (monthIndex: number) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[monthIndex];
  }
  
  const generatePeriodName = (type: 'weekly' | 'monthly'): string => {
    const now = new Date()
    
    if (type === 'weekly') {
      return `Week ${getCurrentWeekNumber()}, ${now.getFullYear()}`
    } else {
      return `${getMonthName(now.getMonth())} ${now.getFullYear()}`
    }
  }
  
  // Delete a period
  const deletePeriod = (periodName: string) => {
    if (!periodName) return;
    
    // Ask for confirmation
    if (!confirm(`Are you sure you want to delete the period "${periodName}"?`)) {
      return;
    }
    
    try {
      if (activeTab === 'weekly') {
        const weeklyData = getWeeklyWinners();
        const updatedWeeklyData = weeklyData.filter(period => period.period !== periodName);
        saveWeeklyWinners(updatedWeeklyData);
      } else {
        const monthlyData = getMonthlyWinners();
        const updatedMonthlyData = monthlyData.filter(period => period.period !== periodName);
        saveMonthlyWinners(updatedMonthlyData);
      }
      
      // Reset selected period if the deleted one was selected
      if (selectedPeriod === periodName) {
        setSelectedPeriod('');
      }
      
      toast.success(`Period "${periodName}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting period:', error);
      toast.error('Failed to delete period');
    }
  }
  
  // Clean up duplicate periods
  const cleanupDuplicatePeriods = () => {
    try {
      // Get current data
      const weeklyData = getWeeklyWinners()
      const monthlyData = getMonthlyWinners()
      
      // Create maps to track unique periods
      const weeklyMap = new Map()
      const monthlyMap = new Map()
      
      // Process weekly data
      weeklyData.forEach(period => {
        if (!weeklyMap.has(period.period) || 
            weeklyMap.get(period.period).endDate < period.endDate) {
          weeklyMap.set(period.period, period)
        }
      })
      
      // Process monthly data
      monthlyData.forEach(period => {
        if (!monthlyMap.has(period.period) || 
            monthlyMap.get(period.period).endDate < period.endDate) {
          monthlyMap.set(period.period, period)
        }
      })
      
      // Calculate removed items
      const removedCount = 
        (weeklyData.length - weeklyMap.size) + 
        (monthlyData.length - monthlyMap.size)
      
      // Save the cleaned data
      saveWeeklyWinners(Array.from(weeklyMap.values()))
      saveMonthlyWinners(Array.from(monthlyMap.values()))
      
      // Show success message
      if (removedCount > 0) {
        toast.success(`Cleaned up ${removedCount} duplicate period${removedCount !== 1 ? 's' : ''}`)
      } else {
        toast.info('No duplicate periods found')
      }
      
      // Refresh the UI
      setSelectedPeriod('')
    } catch (error) {
      console.error('Error cleaning up periods:', error)
      toast.error('Failed to clean up periods')
    }
  }
  
  // Create a new period
  const createNewPeriod = () => {
    const type = activeTab
    const periodName = generatePeriodName(type)
    const now = new Date()
    
    // Check if a period with this name already exists
    const existingPeriods = type === 'weekly' ? getWeeklyWinners() : getMonthlyWinners()
    if (existingPeriods.some(p => p.period === periodName)) {
      toast.error(`A period named "${periodName}" already exists`)
      return
    }
    
    const newPeriod: WinnersData = {
      period: periodName,
      endDate: now.getTime(),
      winners: [],
      totalPrize: 0
    }
    
    if (type === 'weekly') {
      const weeklyData = getWeeklyWinners()
      saveWeeklyWinners([...weeklyData, newPeriod])
    } else {
      const monthlyData = getMonthlyWinners()
      saveMonthlyWinners([...monthlyData, newPeriod])
    }
    
    setSelectedPeriod(periodName)
  }
  
  // Add a winner to the selected period
  const addWinner = async () => {
    if (!winnerAddress || !selectedPeriod) return
    
    try {
      // Validate the address is a valid public key
      try {
        new PublicKey(winnerAddress); // Just validate, we don't need to store it yet
      } catch (e) {
        toast.error('Invalid wallet address');
        return;
      }
      
      // First, store in local storage for UI display
      const newWinner: Winner = {
        address: winnerAddress,
        position: winnerPosition,
        ticketCount: winnerTickets,
        prize: winnerPrize,
        txId: txId || undefined,
        timestamp: new Date().getTime(),
        distributed: !!txId
      }
      
      if (activeTab === 'weekly') {
        const weeklyData = getWeeklyWinners()
        const periodIndex = weeklyData.findIndex(p => p.period === selectedPeriod)
        
        if (periodIndex >= 0) {
          // Update winners in this period
          weeklyData[periodIndex].winners.push(newWinner)
          // Update total prize
          weeklyData[periodIndex].totalPrize += newWinner.prize
          saveWeeklyWinners(weeklyData)
        }
      } else {
        const monthlyData = getMonthlyWinners()
        const periodIndex = monthlyData.findIndex(p => p.period === selectedPeriod)
        
        if (periodIndex >= 0) {
          // Update winners in this period
          monthlyData[periodIndex].winners.push(newWinner)
          // Update total prize
          monthlyData[periodIndex].totalPrize += newWinner.prize
          saveMonthlyWinners(monthlyData)
        }
      }
      
      // TODO: In a future update, this would be connected to actually update the blockchain
      // For now, we're just using local storage for demonstration purposes
      
      toast.success('Winner added successfully!');
      
      // Reset form
      setWinnerAddress('')
      setWinnerTickets(0)
      setWinnerPrize(0)
      setTxId('')
    } catch (error) {
      console.error('Error adding winner:', error);
      toast.error('Failed to add winner');
    }
  }
  
  // Load actual leaderboard data from blockchain
  useEffect(() => {
    if (fetchLeaderboard.data) {
      const data = activeTab === 'weekly' ? 
        fetchLeaderboard.data.weekly : 
        fetchLeaderboard.data.monthly;
      
      setLeaderboardData(data);
      setIsLoading(false);
    }
  }, [fetchLeaderboard.data, activeTab]);
  
  // Format leaderboard data for display
  const formattedLeaderboardData = leaderboardData.map(entry => ({
    address: entry.user.toString(),
    tickets: activeTab === 'weekly' ? entry.weeklyTickets : entry.monthlyTickets
  })).sort((a, b) => b.tickets - a.tickets);
  
  // Function to get random unique elements from an array
  const getRandomElements = (array: any[], count: number) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };
  
  // Function to distribute prizes to randomly selected players from top X
  const distributePrizes = async () => {
    const config = PRIZE_CONFIG[activeTab];
    const minPlayers = config.winners;
    
    if (!publicKey || !connection || totalPrizeAmount <= 0 || formattedLeaderboardData.length < minPlayers) {
      toast.error(`Unable to distribute prizes. Please check your wallet connection and prize amount. Need at least ${minPlayers} player(s).`);
      return;
    }
    
    try {
      setIsDistributing(true);
      
      // Get qualified pool (top X players)
      const qualifiedPool = formattedLeaderboardData.slice(
        0, 
        Math.min(config.poolSize, formattedLeaderboardData.length)
      );
      
      // Randomly select winners from qualified pool
      const selectedWinners = getRandomElements(qualifiedPool, config.winners);
      
      // Calculate prize amounts based on percentages
      const prizeAmounts = config.percentages.map(percent => 
        totalPrizeAmount * (percent / 100)
      );
      
      // Create transaction
      const transaction = new Transaction();
      
      // Add transfer instructions for each winner
      selectedWinners.forEach((winner, index) => {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(winner.address),
            lamports: Math.floor(prizeAmounts[index] * 1000000000), // Convert SOL to lamports
          })
        );
      });
      
      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Transaction confirmed, save winners to local storage
      const periodName = generatePeriodName(activeTab);
      const now = new Date();
      
      // Create winners for the data structure
      const winnersData = selectedWinners.map((winner, index) => ({
        address: winner.address,
        position: index + 1,
        ticketCount: winner.tickets,
        prize: prizeAmounts[index],
        txId: signature,
        timestamp: now.getTime(),
        distributed: true
      }));
      
      // Create new period data
      const newPeriod: WinnersData = {
        period: periodName,
        endDate: now.getTime(),
        winners: winnersData,
        totalPrize: totalPrizeAmount
      };
      
      // Save to local storage based on period type
      if (activeTab === 'weekly') {
        const weeklyData = getWeeklyWinners();
        saveWeeklyWinners([...weeklyData, newPeriod]);
      } else {
        const monthlyData = getMonthlyWinners();
        saveMonthlyWinners([...monthlyData, newPeriod]);
      }
      
      setSelectedPeriod(periodName);
      setTotalPrizeAmount(0);
      toast.success(`Prizes distributed successfully to ${config.winners} random winner${config.winners > 1 ? 's' : ''}!`);
      
    } catch (error) {
      console.error('Error distributing prizes:', error);
      toast.error('Failed to distribute prizes. Please try again.');
    } finally {
      setIsDistributing(false);
    }
  };
  
  // Get periods for the active tab
  const getPeriods = () => {
    const periods = activeTab === 'weekly' ? getWeeklyWinners() : getMonthlyWinners()
    
    // Sort periods by end date, most recent first
    return periods.sort((a, b) => b.endDate - a.endDate)
  }
  
  // Get winners for the selected period
  const getWinnersForSelectedPeriod = (): Winner[] => {
    const periods = getPeriods()
    const period = periods.find(p => p.period === selectedPeriod)
    return period ? period.winners : []
  }
  
  const winners = getWinnersForSelectedPeriod();

  return (
    <div className="space-y-6">
      {/* Tab Selection */}
      <div className="flex bg-black/20 rounded-lg p-1 w-fit">
        <Button 
          variant="ghost" 
          className={`px-4 py-2 rounded-md transition-all ${activeTab === 'weekly' 
            ? 'bg-purple-700 text-white' 
            : 'text-purple-200 hover:text-white'}`}
          onClick={() => setActiveTab('weekly')}
        >
          <Trophy className="h-4 w-4 mr-2" />
          Weekly Leaderboard
        </Button>
        <Button 
          variant="ghost" 
          className={`px-4 py-2 rounded-md transition-all ${activeTab === 'monthly' 
            ? 'bg-purple-700 text-white' 
            : 'text-purple-200 hover:text-white'}`}
          onClick={() => setActiveTab('monthly')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Monthly Leaderboard
        </Button>
      </div>
      
      {/* Prize Distribution Panel */}
      <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center">
            <CircleDollarSign className="h-5 w-5 text-green-400 mr-2" />
            Automatic Prize Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              {activeTab === 'weekly' ? (
                <>Set the total prize amount and automatically distribute rewards to <strong>1 random winner</strong> selected from the top 50 weekly players.</>
              ) : (
                <>Set the total prize amount and automatically distribute rewards to <strong>3 random winners</strong> selected from the top 100 monthly players. 
                Prizes will be split {PRIZE_CONFIG.monthly.percentages.join('/')}.</>  
              )}
            </p>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Total Prize (SOL)"
                  value={totalPrizeAmount || ''}
                  onChange={(e) => setTotalPrizeAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <Button
                className="bg-green-700 hover:bg-green-600 text-white flex items-center gap-2"
                onClick={distributePrizes}
                disabled={!publicKey || totalPrizeAmount <= 0 || formattedLeaderboardData.length < 3 || isDistributing}
              >
                {isDistributing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CoinsIcon className="h-4 w-4" />
                    Distribute Prizes
                  </>
                )}
              </Button>
            </div>
            
            {formattedLeaderboardData.length >= PRIZE_CONFIG[activeTab].winners ? (
              <div className="bg-black/30 rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-medium text-purple-300 mb-2">Pool Information</h3>
                
                {activeTab === 'weekly' ? (
                  <>
                    <p className="text-xs text-gray-400">
                      <strong>1 random winner</strong> will be selected from the top {Math.min(PRIZE_CONFIG.weekly.poolSize, formattedLeaderboardData.length)} players
                    </p>
                    <div className="flex items-center justify-between text-sm mt-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-400" />
                        <span className="text-white">Random Winner</span>
                      </div>
                      <span className="text-green-400">{totalPrizeAmount.toFixed(2)} SOL (100%)</span>
                    </div>
                    <div className="mt-3 text-xs text-gray-400">
                      <strong>Eligible Players: </strong> {Math.min(PRIZE_CONFIG.weekly.poolSize, formattedLeaderboardData.length)} (shown in the leaderboard)
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-400">
                      <strong>3 random winners</strong> will be selected from the top {Math.min(PRIZE_CONFIG.monthly.poolSize, formattedLeaderboardData.length)} players
                    </p>
                    
                    {PRIZE_CONFIG.monthly.percentages.map((percentage, index) => (
                      <div key={index} className="flex items-center justify-between text-sm mt-2">
                        <div className="flex items-center gap-2">
                          <Trophy className={`h-4 w-4 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : 'text-orange-400'}`} />
                          <span className="text-white">Random Winner #{index + 1}</span>
                        </div>
                        <span className="text-green-400">{(totalPrizeAmount * percentage / 100).toFixed(2)} SOL ({percentage}%)</span>
                      </div>
                    ))}
                    
                    <div className="mt-3 text-xs text-gray-400">
                      <strong>Eligible Players: </strong> {Math.min(PRIZE_CONFIG.monthly.poolSize, formattedLeaderboardData.length)} (shown in the leaderboard)
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-red-900/20 rounded-lg p-4 text-center text-sm">
                <p className="text-red-300">Not enough players to distribute prizes. Need at least {PRIZE_CONFIG[activeTab].winners} player{PRIZE_CONFIG[activeTab].winners > 1 ? 's' : ''}.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Current Leaderboard */}
        <div className="md:col-span-2">
          <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                Current {activeTab === 'weekly' ? 'Weekly' : 'Monthly'} Top Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
                </div>
              ) : formattedLeaderboardData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No players have participated yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Top 10 Players */}
                  {formattedLeaderboardData.slice(0, 10).map((player, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-purple-500/10 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center">
                        <div className="w-8 text-center">
                          {index === 0 && <Trophy className="h-5 w-5 text-yellow-400 inline" />}
                          {index === 1 && <Trophy className="h-5 w-5 text-gray-400 inline" />}
                          {index === 2 && <Trophy className="h-5 w-5 text-orange-400 inline" />}
                          {index > 2 && <span className="text-gray-400">#{index + 1}</span>}
                        </div>
                        <div className="font-mono text-purple-200 text-sm">{ellipsify(player.address)}</div>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-purple-900/40 text-white px-2 py-1 rounded-full text-xs mr-2">
                          {player.tickets} tickets
                        </span>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white hover:bg-purple-700/20"
                          onClick={() => {
                            setWinnerAddress(player.address)
                            setWinnerTickets(player.tickets)
                          }}
                        >
                          <Award className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {formattedLeaderboardData.length > 10 && (
                    <div className="text-center text-gray-400 text-sm pt-2">
                      + {formattedLeaderboardData.length - 10} more players
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Winner Management */}
        <div>
          <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-purple-400 mr-2" />
                  Manage Periods
                </div>
                <Button 
                  onClick={cleanupDuplicatePeriods}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 border-yellow-600/30 text-yellow-400 hover:bg-yellow-950/30"
                >
                  Clean Duplicates
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <select
                  className="flex-1 bg-black/30 border border-purple-500/30 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option value="">Select a period</option>
                  {getPeriods().map((period, i) => (
                    <option key={i} value={period.period}>{period.period}</option>
                  ))}
                </select>
                <Button
                  onClick={createNewPeriod}
                  className="bg-purple-700 hover:bg-purple-600 text-white"
                >
                  New
                </Button>
              </div>
              
              {/* Period List with Delete Options */}
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                {getPeriods().map((period, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-black/30 rounded border border-purple-500/20">
                    <div>
                      <div className="text-white text-sm">{period.period}</div>
                      <div className="text-xs text-gray-400">{new Date(period.endDate).toLocaleDateString()} • {period.winners.length} winners</div>
                    </div>
                    <Button
                      onClick={() => deletePeriod(period.period)}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
              
              {activeTab === 'weekly' ? (
                <div className="text-xs text-gray-400 mt-3">
                  Weekly periods: {getWeeklyWinners().length}
                  <br />
                  Current: Week {getCurrentWeekNumber()}, {new Date().getFullYear()}
                </div>
              ) : (
                <div className="text-xs text-gray-400 mt-3">
                  Monthly periods: {getMonthlyWinners().length}
                  <br />
                  Current: {getMonthName(new Date().getMonth())} {new Date().getFullYear()}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Manual Winner Override (Admin Only) */}
          <Card className="bg-black/20 backdrop-blur-sm border border-purple-600/20 rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                Manual Winner Override
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-purple-950/30 p-3 rounded-md mb-4 border border-yellow-600/20">
                <p className="text-yellow-300 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  This is for manual override only. Typically, winners are selected automatically through the prize distribution system above.
                </p>
              </div>
              {selectedPeriod ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Winner Address</label>
                    <Input
                      className="bg-zinc-800 border-zinc-700 text-white"
                      value={winnerAddress}
                      onChange={(e) => setWinnerAddress(e.target.value)}
                      placeholder="Wallet address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Position</label>
                      <Input
                        type="number"
                        className="bg-zinc-800 border-zinc-700 text-white"
                        value={winnerPosition}
                        onChange={(e) => setWinnerPosition(parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Tickets</label>
                      <Input
                        type="number"
                        className="bg-zinc-800 border-zinc-700 text-white"
                        value={winnerTickets}
                        onChange={(e) => setWinnerTickets(parseInt(e.target.value))}
                        min={0}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Prize (SOL)</label>
                      <Input
                        type="number"
                        step="0.01"
                        className="bg-zinc-800 border-zinc-700 text-white"
                        value={winnerPrize}
                        onChange={(e) => setWinnerPrize(parseFloat(e.target.value))}
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">TX ID (optional)</label>
                      <Input
                        className="bg-zinc-800 border-zinc-700 text-white"
                        value={txId}
                        onChange={(e) => setTxId(e.target.value)}
                        placeholder="Transaction ID"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-green-700 hover:bg-green-600 text-white"
                    onClick={addWinner}
                    disabled={!winnerAddress || winnerPosition < 1 || winnerPrize <= 0}
                  >
                    Add Winner
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  Please select or create a period first
                  <p className="text-xs mt-2 text-yellow-500">Note: Manual winner entry should only be used if the automatic distribution fails</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Winners List */}
      {selectedPeriod && winners && winners.length > 0 && (
        <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                Winners for {selectedPeriod}
              </div>
              <div className="text-sm text-gray-400">
                Total Prize: {winners.reduce((sum: number, w: Winner) => sum + w.prize, 0).toFixed(2)} SOL
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {winners.map((winner: Winner, index: number) => (
                <div key={index} className="border border-purple-500/10 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        {winner.position === 1 && <Trophy className="h-4 w-4 text-yellow-400 mr-2" />}
                        {winner.position === 2 && <Trophy className="h-4 w-4 text-gray-400 mr-2" />}
                        {winner.position === 3 && <Trophy className="h-4 w-4 text-orange-400 mr-2" />}
                        {winner.position > 3 && <span className="text-gray-400 mr-2">#{winner.position}</span>}
                        <span className="text-white font-medium">Position {winner.position}</span>
                      </div>
                      <div className="text-gray-400 text-sm font-mono mb-1">{ellipsify(winner.address)}</div>
                      <div className="text-gray-400 text-xs">
                        {new Date(winner.timestamp).toLocaleDateString()} • 
                        {winner.ticketCount} tickets
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-medium mb-1">{winner.prize.toFixed(2)} SOL</div>
                      {winner.distributed ? (
                        <div className="text-xs">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-green-900/30 text-green-400">
                            Distributed
                          </span>
                          {winner.txId && (
                            <a 
                              href={`https://solscan.io/tx/${winner.txId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-400 hover:underline"
                            >
                              View TX
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end">
                          <Input
                            className="bg-zinc-800 border-zinc-700 text-white text-xs h-7 w-32 mr-2"
                            placeholder="TX ID"
                            value={txId}
                            onChange={(e) => setTxId(e.target.value)}
                          />
                          <Button 
                            className="h-7 text-xs bg-green-700 hover:bg-green-600 text-white"
                            onClick={() => {
                            // Mark winner as distributed
                            if (activeTab === 'weekly') {
                              const weeklyData = getWeeklyWinners()
                              const periodIndex = weeklyData.findIndex(p => p.period === selectedPeriod)
                              
                              if (periodIndex !== -1 && weeklyData[periodIndex].winners) {
                                weeklyData[periodIndex].winners[index].distributed = true
                                weeklyData[periodIndex].winners[index].txId = txId
                                saveWeeklyWinners(weeklyData)
                                toast.success('Prize marked as distributed')
                              }
                            } else {
                              const monthlyData = getMonthlyWinners()
                              const periodIndex = monthlyData.findIndex(p => p.period === selectedPeriod)
                              
                              if (periodIndex !== -1 && monthlyData[periodIndex].winners) {
                                monthlyData[periodIndex].winners[index].distributed = true
                                monthlyData[periodIndex].winners[index].txId = txId
                                saveMonthlyWinners(monthlyData)
                                toast.success('Prize marked as distributed')
                              }
                            }
                          }}
                            disabled={!txId}
                          >
                            Mark Paid
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

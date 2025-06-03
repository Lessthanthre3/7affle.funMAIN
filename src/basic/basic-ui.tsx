import { useBasicProgram, RaffleData, TicketData } from './basic-data-access'
import { Clock as ClockIcon, ArrowRight as ArrowRightIcon, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { MyTicketsGrouped } from "@/components/dashboard/my-tickets-grouped"
import { ellipsify } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminPanel } from './admin-panel'
import { RaffleHistory } from './raffle-history'
import raffleLogoImg from '../images/7F.png'
// Referral functionality removed
import { Leaderboard } from '@/components/dashboard/leaderboard'
import { InformationPage } from '@/components/information-page'

// Component for creating a new raffle
export function BasicCreate() {
  const { initializeRaffle } = useBasicProgram()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ticketPrice, setTicketPrice] = useState('0.1')
  const [durationHours, setDurationHours] = useState('24')
  const [maxTickets, setMaxTickets] = useState('100')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    initializeRaffle.mutateAsync({
      name,
      description,
      ticketPrice: parseFloat(ticketPrice),
      durationHours: parseInt(durationHours),
      maxTickets: parseInt(maxTickets),
    })
  }

  return (
    <div className="border rounded-lg p-6 max-w-md mx-auto bg-zinc-800 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Create New Raffle</h2>
        <p className="text-sm text-zinc-300">Set up a new raffle with customized parameters</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">Raffle Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Awesome Raffle"
            className="bg-zinc-700 text-white placeholder:text-zinc-400 border-zinc-600"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description" className="text-white">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your raffle and its prizes"
            className="w-full px-3 py-2 border rounded-md bg-zinc-700 text-white placeholder:text-zinc-400 border-zinc-600"
            rows={3}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ticketPrice" className="text-white">Ticket Price (SOL)</Label>
            <Input
              id="ticketPrice"
              type="number"
              step="0.01"
              min="0.01"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value)}
              className="bg-zinc-700 text-white placeholder:text-zinc-400 border-zinc-600"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxTickets" className="text-white">Max Tickets</Label>
            <Input
              id="maxTickets"
              type="number"
              min="1"
              value={maxTickets}
              onChange={(e) => setMaxTickets(e.target.value)}
              className="bg-zinc-700 text-white placeholder:text-zinc-400 border-zinc-600"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-white">Duration (hours)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            max="720" // 30 days
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            className="bg-zinc-700 text-white placeholder:text-zinc-400 border-zinc-600"
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
          disabled={initializeRaffle.isPending}
        >
          {initializeRaffle.isPending ? 'Creating...' : 'Create Raffle'}
        </Button>
      </form>
    </div>
  )
}

// Component to display raffle details and allow interaction
export function RaffleCard({ raffle }: { raffle: RaffleData }) {
  const { buyTicket, drawWinner, claimPrize, userStats, myTickets } = useBasicProgram()
  const { publicKey } = useWallet()
  const isOwner = publicKey?.toString() === raffle.authority.toString()
  const isWinner = raffle.winner !== null && publicKey?.toString() === raffle.winner.toString()
  const timeRemaining = raffle.endTimestamp - Date.now()
  const isActive = raffle.isActive && timeRemaining > 0
  const isFull = raffle.totalTickets >= raffle.maxTickets
  const isPendingWinner = !isActive && raffle.winner === null

  // Date formatting is now handled differently

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "Ended"
    
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  // Get progress bar color based on fill percentage
  const getProgressBarColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    
    if (percentage >= 90) return 'bg-gradient-to-r from-orange-500 to-red-500';
    if (percentage >= 75) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    if (percentage >= 50) return 'bg-gradient-to-r from-green-500 to-yellow-500';
    return 'bg-gradient-to-r from-purple-500 to-green-400';
  }

  return (
    <div className="raffle-card flex flex-col h-full rounded-lg overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 shadow-xl transition-all duration-200 transform hover:scale-[1.01] hover:shadow-purple-500/10">
      {/* Header */}
      <div className="relative h-20 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 overflow-hidden">
        {/* Raffle logo with overlay */}
        <div className="absolute -right-6 -top-6 w-32 h-32 flex items-center justify-center opacity-40">
          <img 
            src={raffleLogoImg} 
            alt="7affle Logo"
            className="h-20 w-auto object-contain drop-shadow-lg"
          />
        </div>
        
        {/* Raffle title and status */}
        <div className="absolute inset-0 flex flex-col justify-center p-3">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-semibold text-white truncate">{raffle.name}</h3>
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-900/50 text-green-400 border-green-500/30' : raffle.winner !== null ? 'bg-red-900/50 text-red-400 border-red-500/30' : 'bg-orange-900/50 text-orange-400 border-orange-500/30'} flex items-center gap-1`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : raffle.winner !== null ? 'bg-red-400' : 'bg-orange-400'}`}></span>
              {isActive ? 'Active' : raffle.winner !== null ? 'Completed' : 'Ended'}
            </div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-400 font-mono">{raffle.raffleId}</span>
            <span className="text-xs text-gray-400">{new Date(raffle.startTimestamp).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="p-3 space-y-2.5">
        {/* Price and Total Prize - horizontal compact layout */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800/30 rounded-md p-2 border border-gray-700/30">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-solana-green rounded-full"></span>Price
            </p>
            <p className="text-solana-green font-medium">{raffle.ticketPrice} SOL</p>
          </div>
          <div className="bg-gray-800/30 rounded-md p-2 border border-gray-700/30">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-purple-400 rounded-full"></span>Total Prize
            </p>
            <p className="text-white font-medium">{(raffle.ticketPrice * raffle.totalTickets).toFixed(2)} SOL</p>
          </div>
        </div>
        
        {/* Entries with progress bar */}
        <div className="bg-gray-800/30 rounded-md p-2 border border-gray-700/30">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full"></span>Entries
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-white">{raffle.totalTickets}/{raffle.maxTickets}</span>
              <span className="text-xs text-gray-400">({Math.round((raffle.totalTickets / raffle.maxTickets) * 100)}%)</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressBarColor(raffle.totalTickets, raffle.maxTickets)}`}
              style={{ width: `${Math.min(100, Math.round((raffle.totalTickets / raffle.maxTickets) * 100))}%` }}
            ></div>
          </div>
          
          {/* Contestants indicator */}
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700/30">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-purple-300 rounded-full"></span>Contestants
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-purple-300 font-mono">
                {/* Using the actual uniqueEntrants value from the contract */}
                {raffle.uniqueEntrants}
              </span>
              <span className="text-xs text-gray-500 font-mono">wallets</span>
            </div>
          </div>
          
          {/* Win probability indicator */}
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700/30">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-green-300 rounded-full"></span>Your Chances
            </p>
            <div className="flex items-center gap-1">
              {publicKey ? (
                <>
                  <span className="text-xs text-green-300 font-mono">
                    {/* Calculate probability based on user's tickets for this raffle */}
                    {(() => {
                      // Get user's tickets for this raffle
                      const userTickets = myTickets?.filter((t: TicketData) => 
                        t.raffle.toString() === raffle.address.toString() && 
                        t.isActive
                      ).length || 0;
                      
                      // Calculate win probability
                      if (userTickets === 0) return '0';
                      if (raffle.totalTickets === 0) return '0';
                      
                      const probability = (userTickets / raffle.totalTickets) * 100;
                      return probability.toFixed(1);
                    })()}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">%</span>
                </>
              ) : (
                <span className="text-xs text-gray-500 font-mono">Connect wallet</span>
              )}
            </div>
          </div>
        </div>

        {/* Ends In and Creator */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800/30 rounded-md p-2 border border-gray-700/30">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-pink-400 rounded-full"></span>Ends In
            </p>
            <p className="text-white flex items-center text-sm">
              <span className="w-3.5 h-3.5 inline-block mr-1 text-purple-300 animate-pulse">
                <ClockIcon size={14} />
              </span>
              <span className="font-mono">{formatTimeRemaining(timeRemaining)}</span>
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-md p-2 border border-gray-700/30">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>Creator
            </p>
            <p className="text-white text-xs font-mono truncate">{raffle.authority.toString().slice(0, 3)}...{raffle.authority.toString().slice(-6)}</p>
          </div>
        </div>
        
        {raffle.winner !== null && (
          <div className="mt-2 p-3 bg-gray-800/60 rounded-md border-l-4 border-yellow-500 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <div>
                <p className="text-xs text-yellow-300 mb-1 font-medium">Winner:</p>
                <p className="text-sm text-white">Ticket #{raffle.winner}</p>
                {raffle.winnerAddress && (
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {ellipsify(raffle.winnerAddress.toString())}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 pt-0 mt-auto border-t border-gray-800/70">
        {/* Creator info */}
        <div className="text-xs text-gray-400 mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Created by:</span>
            <span className="font-mono text-gray-300 truncate max-w-[120px]">{raffle.authority.toString().slice(0, 3)}...{raffle.authority.toString().slice(-6)}</span>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>
            <span className="font-mono text-gray-300 ml-1">{new Date(raffle.startTimestamp).toLocaleDateString()}</span>
          </div>
        </div>

        {isActive && !isFull && (
          <button
            onClick={() => buyTicket.mutateAsync({ raffleAddress: raffle.address })}
            disabled={!isActive || isFull || !publicKey || buyTicket.isPending}
            className={`w-full py-3 px-6 rounded-md font-medium text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 ${isActive && !isFull && publicKey ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-md hover:shadow-purple-500/30' : 'bg-gray-700 cursor-not-allowed opacity-60'}`}
          >
            <span>
              {buyTicket.isPending 
                ? 'Processing...' 
                : userStats?.isInitialized 
                  ? 'Buy Ticket' 
                  : 'Register to Enter'}
            </span>
            {!buyTicket.isPending && isActive && !isFull && publicKey && <ArrowRightIcon size={16} />}
          </button>
        )}
        
        {isOwner && isPendingWinner && (
          <Button 
            onClick={() => drawWinner.mutateAsync({ raffleAddress: raffle.address })}
            disabled={drawWinner.isPending}
            className="w-full text-sm py-3 px-6 bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-indigo-500/30 transition-all duration-300"
          >
            {drawWinner.isPending ? 'Drawing...' : 'Draw Winner'}
          </Button>
        )}
        
        {isWinner && (
          <Button
            onClick={() => claimPrize.mutateAsync({ 
              raffleAddress: raffle.address,
              ticketNumber: raffle.winner!
            })}
            disabled={claimPrize.isPending || raffle.prizeClaimed}
            className={`w-full text-sm py-3 px-6 shadow-md transition-all duration-300 ${raffle.prizeClaimed 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/30'}`}
          >
            {claimPrize.isPending 
              ? 'Claiming...' 
              : raffle.prizeClaimed 
                ? 'Prize Claimed' 
                : 'Claim Prize'}
          </Button>
        )}
      </div>
    </div>
  )
}

// Component to display all active raffles
export function RafflesList() {
  // Always call hooks at the top level, before any conditional logic
  const { activeRaffles, fetchRaffles } = useBasicProgram()
  const [statusFilter, setStatusFilter] = useState('active') // 'all', 'active', 'ended'
  const [priceFilter, setPriceFilter] = useState('all') // 'all', 'low', 'mid', 'high', 'premium'
  const [timeFilter, setTimeFilter] = useState('all') // 'all', 'ending-soon', 'day', 'week', 'longer'
  const [currentPage, setCurrentPage] = useState(1) // Pagination - current page
  const rafflesPerPage = 9 // Show 9 raffles per page
  
  // Process data and compute derived state after all hooks are called
  // Filter out cancelled raffles (those with totalTickets = 0 and not active)
  // A raffle is considered cancelled if it has 0 tickets and is not active
  const nonCancelledRaffles = activeRaffles?.filter(raffle => {
    // Keep raffles that either have tickets or are still active
    return raffle.totalTickets > 0 || raffle.isActive
  }) || []
  
  // Filter by status first
  const statusFilteredRaffles = statusFilter === 'all' 
    ? nonCancelledRaffles 
    : statusFilter === 'active' 
      ? nonCancelledRaffles.filter(raffle => raffle.isActive) 
      : nonCancelledRaffles.filter(raffle => !raffle.isActive)
  
  // Then apply price range filter
  const priceFilteredRaffles = statusFilteredRaffles.filter(raffle => {
    const price = raffle.ticketPrice;
    if (priceFilter === 'all') return true;
    if (priceFilter === 'low' && price > 0 && price <= 0.1) return true;
    if (priceFilter === 'mid' && price > 0.1 && price <= 0.5) return true;
    if (priceFilter === 'high' && price > 0.5 && price <= 1.0) return true;
    if (priceFilter === 'premium' && price > 1.0) return true;
    return false;
  })
  
  // Finally apply time remaining filter
  const filteredRaffles = priceFilteredRaffles.filter(raffle => {
    // Skip time filtering for ended raffles
    if (!raffle.isActive) return true;
    
    const timeRemaining = raffle.endTimestamp - Date.now();
    const hoursRemaining = timeRemaining / (1000 * 60 * 60);
    
    if (timeFilter === 'all') return true;
    if (timeFilter === 'ending-soon' && hoursRemaining <= 1) return true;
    if (timeFilter === 'day' && hoursRemaining > 1 && hoursRemaining <= 24) return true;
    if (timeFilter === 'week' && hoursRemaining > 24 && hoursRemaining <= 168) return true;
    if (timeFilter === 'longer' && hoursRemaining > 168) return true;
    return false;
  })
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, priceFilter, timeFilter]);
  
  // Pagination logic
  const totalPages = Math.ceil(filteredRaffles.length / rafflesPerPage);
  const indexOfLastRaffle = currentPage * rafflesPerPage;
  const indexOfFirstRaffle = indexOfLastRaffle - rafflesPerPage;
  const currentRaffles = filteredRaffles.slice(indexOfFirstRaffle, indexOfLastRaffle);
  
  // Page navigation handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Now use conditional rendering in the return statement, not early returns
  return (
    <div>
      {fetchRaffles.isLoading ? (
        <div className="flex justify-center py-16 bg-gray-900/30 rounded-xl border border-gray-800/40">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-green-400/20 border-t-green-400 rounded-full animate-spin-slow"></div>
          </div>
        </div>
      ) : activeRaffles.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-gray-800/40">
          <div className="mx-auto w-16 h-16 mb-4 bg-gray-800/50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Raffles Found</h3>
          <p className="text-gray-400 max-w-md mx-auto">No active raffles are currently available.</p>
          <p className="text-sm text-purple-400 mt-4">Create a new raffle to get started!</p>
        </div>
      ) : (
        <>
          {/* Filter Dropdowns */}
          <div className="flex justify-center mb-6 gap-4">
            {/* Status Filter */}
            <div className="relative">
              <label htmlFor="statusFilter" className="block text-xs text-gray-400 mb-1 ml-1">Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-gray-800/70 text-white border border-gray-700/60 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent w-36 text-sm"
              >
                <option value="all">All Raffles</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 pt-4 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            
            {/* Price Filter */}
            <div className="relative">
              <label htmlFor="priceFilter" className="block text-xs text-gray-400 mb-1 ml-1">Price</label>
              <select
                id="priceFilter"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="appearance-none bg-gray-800/70 text-white border border-gray-700/60 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent w-36 text-sm"
              >
                <option value="all">All Prices</option>
                <option value="low">0-0.1 SOL</option>
                <option value="mid">0.1-0.5 SOL</option>
                <option value="high">0.5-1.0 SOL</option>
                <option value="premium">1.0+ SOL</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 pt-4 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            
            {/* Time Remaining Filter */}
            <div className="relative">
              <label htmlFor="timeFilter" className="block text-xs text-gray-400 mb-1 ml-1">Time Left</label>
              <select
                id="timeFilter"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="appearance-none bg-gray-800/70 text-white border border-gray-700/60 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent w-36 text-sm"
              >
                <option value="all">Any Time</option>
                <option value="ending-soon">&lt; 1 hour</option>
                <option value="day">&lt; 24 hours</option>
                <option value="week">&lt; 1 week</option>
                <option value="longer">&gt; 1 week</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 pt-4 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Results counter */}
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-400">
              {filteredRaffles.length > 0 ? 
                `Showing ${indexOfFirstRaffle + 1}-${Math.min(indexOfLastRaffle, filteredRaffles.length)} of ${filteredRaffles.length} raffles` : 
                ''}  
            </p>
          </div>
          
          {filteredRaffles.length === 0 ? (
            <div className="text-center py-8 bg-gray-900/30 rounded-xl border border-gray-800/40">
              <p className="text-gray-400">No raffles found matching your filters.</p>
            </div>
          ) : (
            <>
              <div className="p-8 bg-gray-900/30 rounded-2xl border border-gray-800/50 shadow-xl shadow-purple-900/10 backdrop-blur-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentRaffles.map(raffle => (
                    <RaffleCard key={raffle.address.toString()} raffle={raffle} />
                  ))}
                </div>
              </div>
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="bg-gray-900/30 rounded-xl border border-gray-800/50 shadow-lg shadow-purple-900/5 backdrop-blur-sm py-4 px-6">
                  <div className="flex justify-center items-center gap-4">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg ${currentPage === 1 ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed' : 'bg-purple-900/40 text-white hover:bg-purple-800/50 transition-all duration-200 hover:shadow-md hover:shadow-purple-900/20'}`}
                      aria-label="Previous Page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="px-4 py-1.5 bg-gray-800/40 rounded-lg border border-gray-700/50 min-w-[100px] text-center">
                      <span className="text-gray-300 font-medium">
                        {currentPage} / {totalPages}
                      </span>
                    </div>
                    
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg ${currentPage === totalPages ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed' : 'bg-purple-900/40 text-white hover:bg-purple-800/50 transition-all duration-200 hover:shadow-md hover:shadow-purple-900/20'}`}
                      aria-label="Next Page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

// Component to display user's tickets
export function MyTickets() {
  // Use the new grouped tickets component
  return <MyTicketsGrouped />
}

// Main component that displays the different tabs
export function BasicProgram({ isWalletConnected = false, isAdmin = false }: { isWalletConnected?: boolean, isAdmin?: boolean }) {
  const { activeRaffles, myTickets, userStats } = useBasicProgram()
  const [activeTab, setActiveTab] = useState('raffles')
  
  // Check if wallet is initialized (has registered user stats)
  // This is used to conditionally show tabs and change button text

  useEffect(() => {
    if (isAdmin) {
      setActiveTab('admin')
    }
  }, [isAdmin])

  // The loading and error states are now handled above with fetchRaffles
  
  // Platform stats
  const totalRaffles = activeRaffles.length
  const totalTickets = activeRaffles.reduce((sum, raffle) => sum + raffle.totalTickets, 0)
  const totalPrizeVolume = activeRaffles.reduce((sum, raffle) => sum + (raffle.ticketPrice * raffle.totalTickets), 0)
  const activePrizePool = activeRaffles
    .filter(raffle => raffle.isActive)
    .reduce((sum, raffle) => sum + (raffle.ticketPrice * raffle.totalTickets), 0)
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Platform stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800/70 p-4 rounded-xl border border-gray-700/50 flex items-center space-x-4 shadow-lg hover:shadow-purple-900/20 transition-all duration-300 hover:-translate-y-1">
          <div className="bg-purple-900/30 rounded-lg p-3">
            <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <p className="text-gray-400 text-sm">TOTAL RAFFLES</p>
            <p className="text-2xl font-bold text-white">{totalRaffles}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-gray-800/70 p-4 rounded-xl border border-gray-700/50 flex items-center space-x-4 shadow-lg hover:shadow-purple-900/20 transition-all duration-300 hover:-translate-y-1">
          <div className="bg-green-900/30 rounded-lg p-3">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-400 text-sm">TOTAL ENTRIES</p>
            <p className="text-2xl font-bold text-white">{totalTickets}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-gray-800/70 p-4 rounded-xl border border-gray-700/50 flex items-center space-x-4 shadow-lg hover:shadow-purple-900/20 transition-all duration-300 hover:-translate-y-1">
          <div className="bg-blue-900/30 rounded-lg p-3">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-400 text-sm">PRIZE VOLUME</p>
            <p className="text-2xl font-bold text-white">{totalPrizeVolume.toFixed(2)} <span className="text-xs text-solana-green">SOL</span></p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-gray-800/70 p-4 rounded-xl border border-gray-700/50 flex items-center space-x-4 shadow-lg hover:shadow-purple-900/20 transition-all duration-300 hover:-translate-y-1">
          <div className="bg-purple-900/30 rounded-lg p-3">
            <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 11V9a2 2 0 00-2-2m2 4v4a2 2 0 104 0v-1m-4-3H9m2 0h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-400 text-sm">ACTIVE PRIZE POOL</p>
            <p className="text-2xl font-bold text-white">{activePrizePool.toFixed(2)} <span className="text-xs text-solana-green">SOL</span></p>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation - Properly structured outside of the stats cards */}
      <div className="bg-gray-900/50 rounded-lg p-1 backdrop-blur-sm border border-gray-800/50 mb-8 mt-8">
        <div className="py-2 flex items-center justify-center space-x-4 overflow-x-auto">
          {/* Active Raffles - Always visible */}
          <button 
            onClick={() => setActiveTab('raffles')}
            className={`py-2.5 px-4 rounded-md transition-all duration-200 ${activeTab === 'raffles' 
              ? 'bg-gradient-to-br from-purple-900/80 to-purple-800/80 text-white font-medium shadow-lg shadow-purple-900/20' 
              : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Active Raffles</span>
              {activeRaffles.length > 0 && (
                <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeRaffles.length}
                </span>
              )}
            </div>
          </button>
          
          {/* Raffle History - Only visible for initialized wallets */}
          {userStats?.isInitialized && (
            <button 
              onClick={() => setActiveTab('history')}
              className={`py-2.5 px-4 rounded-md transition-all duration-200 ${activeTab === 'history' 
                ? 'bg-gradient-to-br from-purple-900/80 to-purple-800/80 text-white font-medium shadow-lg shadow-purple-900/20' 
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
            >
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4" />
                <span>Raffle History</span>
              </div>
            </button>
          )}
          
          {/* Information - Always visible */}
          <button 
            onClick={() => setActiveTab('info')}
            className={`py-2.5 px-4 rounded-md transition-all duration-200 ${activeTab === 'info' 
              ? 'bg-gradient-to-br from-purple-900/80 to-purple-800/80 text-white font-medium shadow-lg shadow-purple-900/20' 
              : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Information</span>
            </div>
          </button>
          
          {/* My Tickets - Only visible when wallet is connected */}
          {isWalletConnected && (
            <button 
              onClick={() => setActiveTab('mytickets')}
              className={`py-2.5 px-4 rounded-md transition-all duration-200 ${activeTab === 'mytickets' 
                ? 'bg-gradient-to-br from-purple-900/80 to-purple-800/80 text-white font-medium shadow-lg shadow-purple-900/20' 
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <span>My Tickets</span>
                {myTickets.length > 0 && (
                  <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {myTickets.length}
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Exclusive Raffle - Only visible when wallet is connected */}
          {isWalletConnected && (
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`py-2.5 px-4 rounded-md transition-all duration-200 ${activeTab === 'leaderboard' 
                ? 'bg-gradient-to-br from-purple-900/80 to-purple-800/80 text-white font-medium shadow-lg shadow-purple-900/20' 
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
            >
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>Exclusive Raffle</span>
              </div>
            </button>
          )}
          
          {/* Admin-only tabs */}
          {isAdmin && (
            <>
              <button 
                onClick={() => setActiveTab('create')}
                className={`py-2.5 px-4 rounded-md transition-all duration-200 ${activeTab === 'create' 
                  ? 'bg-gradient-to-br from-purple-900/80 to-purple-800/80 text-white font-medium shadow-lg shadow-purple-900/20' 
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Raffle</span>
                </div>
              </button>
              
              <button 
                onClick={() => setActiveTab('admin')}
                className={`py-2.5 px-4 rounded-md transition-all duration-200 ${activeTab === 'admin' 
                  ? 'bg-gradient-to-br from-purple-900/80 to-purple-800/80 text-white font-medium shadow-lg shadow-purple-900/20' 
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Admin</span>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="py-4">
        {activeTab === 'raffles' && <RafflesList />}
        {activeTab === 'mytickets' && <MyTickets />}
        {activeTab === 'history' && <RaffleHistory />}
        {/* Referrals functionality removed */}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'info' && <InformationPage />}
        {activeTab === 'create' && isAdmin && <BasicCreate />}
        {activeTab === 'admin' && isAdmin && <AdminPanel />}
      </div>
    </div>
  )
}

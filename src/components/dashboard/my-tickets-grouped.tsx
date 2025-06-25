import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { useBasicProgram } from '@/basic/basic-data-access'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ellipsify } from '@/lib/utils'

// Define the ticket type
interface Ticket {
  raffle: PublicKey
  ticketNumber: number
  isWinner: boolean
  isActive: boolean
  purchaseDate: number
  raffleName?: string
}

// Group tickets by raffle
const groupTicketsByRaffle = (tickets: Ticket[]) => {
  const groupedTickets: Record<string, Ticket[]> = {}
  
  tickets.forEach((ticket) => {
    const raffleKey = ticket.raffle.toString()
    if (!groupedTickets[raffleKey]) {
      groupedTickets[raffleKey] = []
    }
    groupedTickets[raffleKey].push(ticket)
  })
  
  return groupedTickets
}

// Component to display user's tickets grouped by raffle
export function MyTicketsGrouped() {
  const { myTickets, fetchMyTickets, claimPrize, activeRaffles } = useBasicProgram()
  const [currentPage, setCurrentPage] = useState(1)
  const rafflesPerPage = 5
  const [selectedRaffle, setSelectedRaffle] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  if (fetchMyTickets.isLoading) {
    return <div className="flex justify-center py-8"><span className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></span></div>
  }
  
  if (myTickets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">You don't have any tickets yet.</p>
        <p className="text-sm text-purple-400 mt-2">Purchase a ticket in an active raffle!</p>
      </div>
    )
  }
  
  // Group tickets by raffle
  const groupedTickets = groupTicketsByRaffle(myTickets)
  const raffleKeys = Object.keys(groupedTickets)
  
  // Calculate pagination for raffles
  const totalPages = Math.ceil(raffleKeys.length / rafflesPerPage)
  const indexOfLastRaffle = currentPage * rafflesPerPage
  const indexOfFirstRaffle = indexOfLastRaffle - rafflesPerPage
  const currentRaffleKeys = raffleKeys.slice(indexOfFirstRaffle, indexOfLastRaffle)
  
  // Function to change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)
  
  // Find raffle details
  const findRaffleDetails = (raffleAddress: string) => {
    return activeRaffles.find((r: any) => r.address.toString() === raffleAddress)
  }
  
  // Check if the user has winning tickets for a raffle
  const hasWinningTickets = (tickets: Ticket[]) => {
    return tickets.some(ticket => ticket.isWinner)
  }
  
  // Handle claiming prize
  const handleClaimPrize = (raffleAddress: PublicKey, ticketNumber: number) => {
    claimPrize.mutateAsync({ 
      raffleAddress,
      ticketNumber
    })
  }
  
  // Show ticket details for a raffle
  const showTicketDetails = (raffleKey: string) => {
    setSelectedRaffle(raffleKey)
    setIsDialogOpen(true)
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {currentRaffleKeys.map((raffleKey) => {
          const tickets = groupedTickets[raffleKey]
          const raffleData = findRaffleDetails(raffleKey)
          const hasWinners = hasWinningTickets(tickets)
          
          // Get the first ticket to display raffle info
          const firstTicket = tickets[0]
          
          return (
            <Card 
              key={raffleKey} 
              className={`bg-gray-800/50 border-gray-700/50 hover:bg-purple-900/10 transition-colors cursor-pointer overflow-hidden`}
              onClick={() => showTicketDetails(raffleKey)}
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-purple-400">
                        {firstTicket.raffleName || ellipsify(raffleKey)}
                      </h3>
                      {hasWinners && (
                        <span className="ml-3 bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">
                          Winner! 🏆
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center space-x-3">
                      <div className="bg-purple-900/30 border border-purple-500/30 rounded-md px-3 py-1">
                        <span className="text-xs text-purple-300 font-medium">Raffle ID: </span>
                        <span className="text-xs text-green-400 font-bold">{raffleData?.raffleId || '—'}</span>
                      </div>
                      <div className="bg-green-900/20 border border-green-500/30 rounded-md px-3 py-1">
                        <span className="text-xs text-green-300 font-medium">{tickets.length} </span>
                        <span className="text-xs text-purple-300">{tickets.length === 1 ? 'Ticket' : 'Tickets'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`mr-3 px-3 py-1 rounded-full text-sm ${firstTicket.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                      {firstTicket.isActive ? 'Active' : 'Completed'}
                    </span>
                    <Button 
                      variant="ghost" 
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          <Button 
            onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
            disabled={currentPage === 1}
            className="bg-purple-700 hover:bg-purple-800 disabled:bg-gray-700"
          >
            Previous
          </Button>
          
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button 
              key={i}
              onClick={() => paginate(i + 1)}
              className={currentPage === i + 1 ? 'bg-purple-500' : 'bg-purple-700 hover:bg-purple-800'}
            >
              {i + 1}
            </Button>
          ))}
          
          <Button 
            onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
            disabled={currentPage === totalPages}
            className="bg-purple-700 hover:bg-purple-800 disabled:bg-gray-700"
          >
            Next
          </Button>
        </div>
      )}
      
      {/* Ticket Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-purple-400">
              {selectedRaffle && groupedTickets[selectedRaffle][0].raffleName ? 
                groupedTickets[selectedRaffle][0].raffleName : 
                `Raffle Details - ${selectedRaffle ? ellipsify(selectedRaffle) : ''}`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRaffle && (
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse rounded-lg overflow-hidden">
                  <thead className="bg-purple-900 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">#</th>
                      <th className="py-3 px-4 text-left">Ticket Number</th>
                      <th className="py-3 px-4 text-left">Purchase Date</th>
                      <th className="py-3 px-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedTickets[selectedRaffle].map((ticket, index) => {
                      const raffleData = findRaffleDetails(selectedRaffle)
                      const isPrizeClaimed = raffleData?.prizeClaimed || false
                      
                      return (
                        <tr 
                          key={index} 
                          className={`border-b border-gray-700 ${index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-900/50'} hover:bg-purple-900/10 transition-colors`}
                        >
                          <td className="py-3 px-4">{index + 1}</td>
                          <td className="py-3 px-4">{ticket.ticketNumber}</td>
                          <td className="py-3 px-4 text-gray-400">{new Date(ticket.purchaseDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            {ticket.isWinner ? (
                              <div className="flex items-center gap-3">
                                <span className="text-yellow-400 font-medium">Winner! 🏆</span>
                                
                                <Button
                                  onClick={() => handleClaimPrize(ticket.raffle, ticket.ticketNumber)}
                                  disabled={claimPrize.isPending || isPrizeClaimed}
                                  className={`py-1 px-3 text-xs ${isPrizeClaimed 
                                    ? 'bg-gray-600 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700'}`}
                                  size="sm"
                                >
                                  {claimPrize.isPending 
                                    ? 'Claiming...' 
                                    : isPrizeClaimed 
                                      ? 'Prize Claimed' 
                                      : 'Claim Prize'}
                                </Button>
                              </div>
                            ) : ticket.isActive ? (
                              <span className="text-green-400">Active</span>
                            ) : (
                              <span className="text-gray-400">Completed</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

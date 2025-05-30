import { PublicKey } from '@solana/web3.js'
import { useMemo, useState } from 'react'
import { ExplorerLink } from '../cluster/cluster-ui'
import { AccountBalance } from './account-ui'
import { AppHero } from '../app-hero'
import { ellipsify } from '@/lib/utils'
import { useParams } from 'react-router'
import { useBasicProgram } from '@/basic/basic-data-access'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RaffleLogo } from '@/components/7affle-logo'

export default function AccountDetailFeature() {
  const params = useParams() as { address: string }
  const address = useMemo(() => {
    if (!params.address) {
      return
    }
    try {
      return new PublicKey(params.address)
    } catch (e) {
      console.log(`Invalid public key`, e)
    }
  }, [params])
  
  const { activeRaffles } = useBasicProgram()
  const [activeTab, setActiveTab] = useState('myTickets')
  
  if (!address) {
    return <div>Error loading account</div>
  }

  // Filter user's tickets from all raffles
  const myTickets = activeRaffles.data?.flatMap(raffle => 
    raffle.tickets
      .filter(ticket => ticket.buyer.toString() === address.toString())
      .map(ticket => ({ ...ticket, raffle }))
  ) || []

  // Potential winnings (tickets in active raffles)
  const potentialWinnings = myTickets
    .filter(ticket => ticket.raffle.isActive)
    .reduce((acc, ticket) => acc + (ticket.raffle.ticketPrice * ticket.raffle.totalTickets * 0.95), 0)

  // Won prizes (if any)
  const wonPrizes = activeRaffles.data
    ?.filter(raffle => 
      !raffle.isActive && 
      raffle.winner?.toString() === address.toString()
    ) || []
  
  return (
    <div>
      <AppHero
        title={
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-bold">My Raffle Dashboard</h2>
            <AccountBalance address={address} />
          </div>
        }
        subtitle={
          <div className="flex flex-col items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="py-1 px-3 border-purple-500/30">
                {myTickets.length} Tickets Purchased
              </Badge>
              {wonPrizes.length > 0 && (
                <Badge variant="outline" className="py-1 px-3 border-green-500/30 bg-green-500/10">
                  {wonPrizes.length} Prizes Won
                </Badge>
              )}
            </div>
            <div>
              <ExplorerLink path={`account/${address}`} label={ellipsify(address.toString())} />
            </div>
          </div>
        }
      />
      
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="myTickets" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="myTickets">My Tickets</TabsTrigger>
            <TabsTrigger value="winnings">Winnings</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="myTickets" className="space-y-4">
            {myTickets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTickets.map((ticket, index) => (
                  <div key={index} className="bg-gray-800/50 border border-purple-500/20 rounded-lg p-4 overflow-hidden relative hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10">
                        <RaffleLogo size="sm" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{ticket.raffle.name}</h3>
                        <p className="text-xs text-gray-400">{ticket.raffle.isActive ? 'Active' : 'Ended'}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Ticket #{ticket.ticketNumber}</span>
                      <span className="text-sm text-solana-green">{ticket.raffle.ticketPrice} SOL</span>
                    </div>
                    
                    <div className="mt-3">
                      {ticket.raffle.isActive ? (
                        <div className="text-xs text-gray-400 italic">
                          Potential prize: {(ticket.raffle.ticketPrice * ticket.raffle.totalTickets * 0.95).toFixed(2)} SOL
                        </div>
                      ) : ticket.raffle.winner?.toString() === address.toString() ? (
                        <Badge className="bg-green-500/20 hover:bg-green-500/30 text-green-300 py-1">
                          Winner!
                        </Badge>
                      ) : (
                        <div className="text-xs text-gray-400 italic">
                          Better luck next time
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-700 rounded-lg">
                <p className="text-gray-400">You haven't purchased any raffle tickets yet.</p>
                <a href="/raffles" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
                  Browse active raffles →
                </a>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="winnings">
            {wonPrizes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wonPrizes.map((raffle, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-800/50 to-green-900/20 border border-green-500/30 rounded-lg p-5 overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-white">{raffle.name}</h3>
                      <Badge className="bg-green-500/20 hover:bg-green-500/30 text-green-300">
                        Won
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-300">Prize Amount:</span>
                        <span className="text-solana-green font-medium">
                          {(raffle.ticketPrice * raffle.totalTickets * 0.95).toFixed(2)} SOL
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-300">Tickets Sold:</span>
                        <span className="text-gray-300">{raffle.totalTickets}/{raffle.maxTickets}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-300">Your Ticket:</span>
                        <span className="text-white font-mono">
                          #{raffle.winner && raffle.tickets.find(t => t.buyer.toString() === address.toString())?.ticketNumber}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-700/50">
                      <ExplorerLink path={`account/${raffle.publicKey}`} label="View on Explorer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-700 rounded-lg">
                <p className="text-gray-400">You haven't won any prizes yet. Keep trying!</p>
                <a href="/raffles" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
                  Enter more raffles →
                </a>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-medium mb-4">Raffle Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Tickets Purchased:</span>
                    <span className="font-medium">{myTickets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Active Tickets:</span>
                    <span className="font-medium">
                      {myTickets.filter(t => t.raffle.isActive).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total SOL Spent:</span>
                    <span className="text-solana-green font-medium">
                      {myTickets.reduce((acc, t) => acc + t.raffle.ticketPrice, 0).toFixed(2)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Prizes Won:</span>
                    <span className="font-medium">{wonPrizes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Potential Active Winnings:</span>
                    <span className="text-solana-green font-medium">
                      {potentialWinnings.toFixed(2)} SOL
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-medium mb-4">Participation History</h3>
                <div className="space-y-4">
                  {activeRaffles.data
                    ?.filter(raffle => raffle.tickets.some(t => t.buyer.toString() === address.toString()))
                    .slice(0, 5)
                    .map((raffle, index) => (
                      <div key={index} className="flex justify-between pb-2 border-b border-gray-700/50">
                        <span className="truncate max-w-[200px]">{raffle.name}</span>
                        <span className={raffle.isActive ? 'text-blue-400' : 'text-gray-400'}>
                          {raffle.isActive ? 'Active' : 'Ended'}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

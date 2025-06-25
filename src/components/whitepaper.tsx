import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'

export function WhitepaperButton() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center p-1 rounded-full bg-purple-800/50 hover:bg-purple-700/70 transition-colors"
        title="View Whitepaper"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </Button>
      
      <WhitepaperDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  )
}

function WhitepaperDialog({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (isOpen: boolean) => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-purple-400 text-center">
            7affle.fun Whitepaper
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-green-400 mb-3">Introduction</h2>
            <p className="text-gray-300">
              7affle.fun is a decentralized raffle platform built on the Solana blockchain. Our mission is to provide a transparent, 
              fair, and engaging raffle experience that leverages blockchain technology to ensure verifiable randomness and 
              trustless prize distribution.
            </p>
          </section>
          
          {/* Platform Architecture */}
          <section>
            <h2 className="text-xl font-semibold text-green-400 mb-3">Platform Architecture</h2>
            <p className="text-gray-300 mb-3">
              The 7affle platform consists of three core components:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-gray-300">
              <li>
                <span className="text-purple-300 font-medium">Smart Contract (Program):</span> A Solana program written in Rust using the Anchor framework that handles raffle creation, ticket purchases, winner selection, and prize distribution.
              </li>
              <li>
                <span className="text-purple-300 font-medium">Frontend Interface:</span> A React-based web application that provides an intuitive user interface for interacting with the raffle program.
              </li>
              <li>
                <span className="text-purple-300 font-medium">Telegram Bot:</span> Supporting services for notifications, analytics, and administrative functions.
              </li>
            </ol>
          </section>
          
          {/* Raffle Mechanics */}
          <section>
            <h2 className="text-xl font-semibold text-green-400 mb-3">Raffle Mechanics</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-purple-300 mb-2">Raffle Creation</h3>
                <p className="text-gray-300">
                  Raffles are created by platform administrators with the following parameters:
                </p>
                <ul className="list-disc pl-5 mt-2 text-gray-300">
                  <li>Raffle name and description</li>
                  <li>Ticket price (in SOL)</li>
                  <li>Maximum number of tickets available</li>
                  <li>Duration of the raffle</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-purple-300 mb-2">Ticket Purchases</h3>
                <p className="text-gray-300">
                  Users can purchase tickets for active raffles using SOL. Each ticket purchase:
                </p>
                <ul className="list-disc pl-5 mt-2 text-gray-300">
                  <li>Creates a unique ticket account on the Solana blockchain</li>
                  <li>Associates the ticket with the buyer's wallet address</li>
                  <li>Adds to the total prize pool</li>
                  <li>Updates the user's statistics for leaderboard tracking</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-purple-300 mb-2">Winner Selection</h3>
                <p className="text-gray-300">
                  When a raffle ends, a winner is selected through the following process:
                </p>
                <ol className="list-decimal pl-5 mt-2 text-gray-300">
                  <li>A random number is generated using a combination of on-chain data sources</li>
                  <li>The random number is used to select a winning ticket from all purchased tickets</li>
                  <li>The winner is recorded on-chain and can be verified by anyone</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-purple-300 mb-2">Prize Distribution</h3>
                <p className="text-gray-300">
                  The prize distribution follows these rules:
                </p>
                <ul className="list-disc pl-5 mt-2 text-gray-300">
                  <li>95% of the total ticket sales go to the winner</li>
                  <li>5% is retained as a platform fee</li>
                  <li>Winners must claim their prizes through the platform interface</li>
                  <li>Prizes are automatically transferred to the winner's wallet upon claiming</li>
                </ul>
              </div>
            </div>
          </section>
          
          {/* Security & Transparency */}
          <section>
            <h2 className="text-xl font-semibold text-green-400 mb-3">Security & Transparency</h2>
            <div className="space-y-3 text-gray-300">
              <p>
                7affle.fun prioritizes security and transparency through:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="text-purple-300 font-medium">Open Source Code:</span> All smart contract code is open source and available for review.
                </li>
                <li>
                  <span className="text-purple-300 font-medium">Verifiable Randomness:</span> Our winner selection process uses blockchain data to ensure fairness and prevent manipulation.
                </li>
                <li>
                  <span className="text-purple-300 font-medium">On-chain Verification:</span> All raffle activities are recorded on the Solana blockchain and can be independently verified.
                </li>
                
              </ul>
            </div>
          </section>
          
          {/* Community & Governance */}
          <section>
            <h2 className="text-xl font-semibold text-green-400 mb-3">Community & Governance</h2>
            <p className="text-gray-300">
              7affle.fun is committed to building a vibrant community of users. Future plans include:
            </p>
            <ul className="list-disc pl-5 mt-2 text-gray-300">
              <li>Reviewing community-suggested feedback</li>
              <li>Special events and exclusive raffles</li>
              
              
            </ul>
          </section>
          
          {/* Roadmap */}
          <section>
            <h2 className="text-xl font-semibold text-green-400 mb-3">Roadmap</h2>
            <div className="space-y-3">
              <div className="bg-purple-900/20 p-3 rounded-md border border-purple-500/30">
                <h3 className="text-purple-300 font-medium">Phase 1: Launch (Current)</h3>
                <ul className="list-disc pl-5 mt-1 text-gray-300">
                  <li>Launch 7affle.fun platform on Pump.fun</li>
                  <li>Build interest and a community</li>
                  
                </ul>
              </div>
              
              <div className="bg-purple-900/20 p-3 rounded-md border border-purple-500/30">
                <h3 className="text-purple-300 font-medium">Phase 2: Enhancement</h3>
                <ul className="list-disc pl-5 mt-1 text-gray-300">
                  
                  <li>Deploy main-net smart contract & pay Dexscreener</li>
                  <li>Begin hosting live raffles</li>
                  <li>Improved Telegram features</li>
                  
                </ul>
              </div>
              
              <div className="bg-purple-900/20 p-3 rounded-md border border-purple-500/30">
                <h3 className="text-purple-300 font-medium">Phase 3: Expansion</h3>
                <ul className="list-disc pl-5 mt-1 text-gray-300">
                  <li>Multi-token support</li>
                  <li>Cross-chain integration</li>
                  <li>Referral system</li>
                  
                </ul>
              </div>
            </div>
          </section>
          
          {/* Conclusion */}
          <section>
            <h2 className="text-xl font-semibold text-green-400 mb-3">Conclusion</h2>
            <p className="text-gray-300">
              7affle.fun represents the next generation of decentralized raffles, combining the transparency and security of blockchain technology 
              with an engaging user experience. By leveraging the speed and low cost of the Solana blockchain, we're able to offer a seamless 
              raffle platform that's accessible to everyone.
            </p>
            <p className="text-gray-300 mt-3">
              Join us as we revolutionize the raffle experience and build a thriving community around fair, transparent, and exciting prize opportunities.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

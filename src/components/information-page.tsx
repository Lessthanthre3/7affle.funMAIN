import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function InformationPage() {
  return (
    <div className="space-y-8 text-center">
      {/* Introduction */}
      <Card className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-lg border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Welcome to 7affle.fun</CardTitle>
          <CardDescription className="text-purple-200">
            The ultimate decentralized raffle platform on Solana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-white text-center">
            7affle.fun provides a fair, transparent, and fun way to participate in raffles using the Solana blockchain. 
            Our platform ensures complete randomness in winner selection and distributes prizes automatically through smart contracts.
          </p>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="border border-purple-500/20 rounded-lg bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How 7affle.fun Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-500/20">
              <div className="flex items-center mb-3">
                <div className="bg-purple-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-white font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-white">Browse Raffles</h3>
              </div>
              <p className="text-gray-300 text-center">Explore active raffles on the platform. Each raffle shows the prize, ticket price, and time remaining.</p>
            </div>
            
            <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-500/20">
              <div className="flex items-center mb-3">
                <div className="bg-purple-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-white font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-white">Buy Tickets</h3>
              </div>
              <p className="text-gray-300 text-center">Purchase tickets for the raffles you're interested in. Each ticket gives you a chance to win the prize.</p>
            </div>
            
            <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-500/20">
              <div className="flex items-center mb-3">
                <div className="bg-purple-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-white font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white">Win Prizes</h3>
              </div>
              <p className="text-gray-300 text-center">When a raffle ends, a winner is randomly selected from all ticket holders. Winners must claim their prizes via the "My Tickets" tab.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Exclusive Raffle */}
      <Card className="border border-purple-500/20 rounded-lg bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Exclusive Raffle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            The Exclusive Raffle is our premium weekly and monthly prize draw system. 
            Players who purchase raffle tickets are automatically entered into these draws, 
            giving you additional chances to win prizes beyond the individual raffles.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">Weekly Draws</h3>
              <p className="text-gray-300 text-center">
                Every week, we select winners from all active raffle participants. 
                The more tickets you buy across all raffles, the higher your chances of winning the weekly prizes.
              </p>
            </div>
            
            <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">Monthly Draws</h3>
              <p className="text-gray-300 text-center">
                At the end of each month, we hold a special drawing with larger prize pools. 
                Monthly draws include prizes for the top three participants based on ticket purchases.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Smart Contracts */}
      <Card className="border border-purple-500/20 rounded-lg bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Smart Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">Raffle Contract</h3>
              <div className="flex flex-col items-center space-y-2">
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 mb-1">Address: GUXx1x2kMBxJwLmyxWJMaWAqMhJHx7zabDqHdv7AFFLE</span>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">7affle Token</h3>
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center justify-center">
                  <span className="text-gray-400 mr-2">Token Address:</span>
                  <span className="text-purple-300 font-mono">Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* FAQ */}
      <Card className="border border-purple-500/20 rounded-lg bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            FAQ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300 justify-center">How do raffles work on 7affle?</AccordionTrigger>
              <AccordionContent className="text-gray-300 text-center">
                Raffles on 7affle.fun are fully decentralized and run on the Solana blockchain. Each raffle has a 
                set number of tickets available at a fixed price. When the raffle period ends, a winner is randomly 
                selected using verifiable random functions on the blockchain. The winner can then claim their prize 
                directly to their wallet.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300 justify-center">How do I receive my prize if I win?</AccordionTrigger>
              <AccordionContent className="text-gray-300 text-center">
                If you win a raffle, you'll need to claim your prize through the "My Tickets" tab. 
                Navigate to that section, locate your winning ticket, and click the claim button. 
                The prize will then be transferred to your connected wallet address.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300 justify-center">How are winners selected?</AccordionTrigger>
              <AccordionContent className="text-gray-300 text-center">
                Winners are selected using a cryptographically secure random number generator on the Solana blockchain. 
                This ensures that the selection process is completely fair and transparent. Each ticket has an equal 
                chance of being selected as the winner.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300 justify-center">Can I create my own raffle?</AccordionTrigger>
              <AccordionContent className="text-gray-300 text-center">
                No, only platform administrators can create raffles. This restriction is in place to ensure 
                the quality and legitimacy of all raffles on the platform. All official raffles undergo verification 
                and quality control before being published.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300 justify-center">What fees does 7affle charge?</AccordionTrigger>
              <AccordionContent className="text-gray-300 text-center">
                7affle charges a 5% platform fee on all raffles. This fee is automatically deducted when 
                prizes are distributed. The fee helps maintain the platform, develop new features, and ensure 
                the long-term sustainability of the service.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300 justify-center">How do I get started if I'm new to Web3?</AccordionTrigger>
              <AccordionContent className="text-gray-300 text-left px-4">
                <div className="space-y-4">
                  <p>
                    If you're new to Web3 and Solana, follow these steps to get started with 7affle:
                  </p>
                  
                  <div className="space-y-2">
                    <h4 className="text-purple-300 font-medium">1. Install Phantom Wallet</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Visit <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">phantom.app</a> on your desktop browser</li>
                      <li>Click "Add to browser" and follow the installation instructions</li>
                      <li>For mobile users, download the Phantom app from the App Store or Google Play</li>
                      <li>Create a new wallet and securely store your recovery phrase (never share this with anyone!)</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-purple-300 font-medium">2. Add funds to your wallet</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Open your Phantom wallet and click the "Deposit" button</li>
                      <li>You can purchase SOL directly within Phantom using a credit/debit card</li>
                      <li>Alternatively, you can transfer SOL from an exchange like Coinbase, Binance, or FTX</li>
                      <li>For exchanges, copy your wallet address from Phantom and use it as the withdrawal address</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-purple-300 font-medium">3. Connect to 7affle.fun</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>On 7affle.fun, click the "Connect Wallet" button in the top right corner</li>
                      <li>Select Phantom from the list of wallet options</li>
                      <li>Approve the connection request in your Phantom wallet</li>
                      <li>You're now connected and ready to participate in raffles!</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300 justify-center">How do I buy tickets for a raffle?</AccordionTrigger>
              <AccordionContent className="text-gray-300 text-left px-4">
                <div className="space-y-4">
                  <p>
                    Once you've connected your wallet to 7affle.fun, buying tickets is easy:
                  </p>
                  
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Browse the active raffles on the homepage</li>
                    <li>Click on a raffle you're interested in to view details</li>
                    <li>Click the "Buy Ticket" button</li>
                    <li>Select the number of tickets you want to purchase</li>
                    <li>Confirm the transaction in your Phantom wallet when prompted</li>
                    <li>Wait for the transaction to be confirmed on the blockchain</li>
                    <li>Your tickets will appear in the "My Tickets" section</li>
                  </ol>
                  
                  <p className="text-yellow-300 text-sm">
                    Note: Make sure you have enough SOL in your wallet to cover the ticket price plus a small transaction fee.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-8" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300 justify-center">What is SOL and why do I need it?</AccordionTrigger>
              <AccordionContent className="text-gray-300 text-center">
                SOL is the native cryptocurrency of the Solana blockchain. You need SOL to participate in raffles on 7affle.fun and to pay for transaction fees on the Solana network. Think of SOL as the digital currency that powers all activities on the platform, similar to how you would need traditional currency to enter a physical raffle.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-9" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300 justify-center">Is my wallet and personal information safe?</AccordionTrigger>
              <AccordionContent className="text-gray-300 text-center">
                7affle.fun never asks or stores any of your private information. We only interact with your wallet through approved transactions that you must manually confirm. Your personal information remains private, and all transactions occur directly on the Solana blockchain. Always practice good security habits: never share your recovery phrase, be cautious of phishing attempts, and disconnect your wallet when not using the site.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
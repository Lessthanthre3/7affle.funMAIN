import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function InformationPage() {
  return (
    <div className="space-y-8">
      {/* Introduction */}
      <Card className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-lg border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Welcome to 7affle.fun</CardTitle>
          <CardDescription className="text-purple-200">
            The ultimate decentralized raffle platform on Solana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-white">
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
              <p className="text-gray-300">Explore active raffles on the platform. Each raffle shows the prize, ticket price, and time remaining.</p>
            </div>
            
            <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-500/20">
              <div className="flex items-center mb-3">
                <div className="bg-purple-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-white font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-white">Buy Tickets</h3>
              </div>
              <p className="text-gray-300">Purchase tickets for the raffles you're interested in. Each ticket gives you a chance to win the prize.</p>
            </div>
            
            <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-500/20">
              <div className="flex items-center mb-3">
                <div className="bg-purple-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-white font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white">Win Prizes</h3>
              </div>
              <p className="text-gray-300">When a raffle ends, a winner is randomly selected from all ticket holders. Winners must claim their prizes via the "My Tickets" tab.</p>
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
              <p className="text-gray-300">
                Every week, we select winners from all active raffle participants. 
                The more tickets you buy across all raffles, the higher your chances of winning the weekly prizes.
              </p>
            </div>
            
            <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">Monthly Draws</h3>
              <p className="text-gray-300">
                At the end of each month, we hold a special drawing with larger prize pools. 
                Monthly draws include prizes for the top three participants based on ticket purchases.
              </p>
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
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300">How do raffles work on 7affle?</AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Raffles on 7affle.fun are fully decentralized and run on the Solana blockchain. Each raffle has a 
                set number of tickets available at a fixed price. When the raffle period ends, a winner is randomly 
                selected using verifiable random functions on the blockchain. The winner can then claim their prize 
                directly to their wallet.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300">How do I receive my prize if I win?</AccordionTrigger>
              <AccordionContent className="text-gray-300">
                If you win a raffle, you'll need to claim your prize through the "My Tickets" tab. 
                Navigate to that section, locate your winning ticket, and click the claim button. 
                The prize will then be transferred to your connected wallet address.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300">How are winners selected?</AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Winners are selected using a cryptographically secure random number generator on the Solana blockchain. 
                This ensures that the selection process is completely fair and transparent. Each ticket has an equal 
                chance of being selected as the winner.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300">Can I create my own raffle?</AccordionTrigger>
              <AccordionContent className="text-gray-300">
                No, only platform administrators can create raffles. This restriction is in place to ensure 
                the quality and legitimacy of all raffles on the platform. All official raffles undergo verification 
                and quality control before being published.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border border-purple-500/20 rounded-lg bg-purple-900/10 px-4">
              <AccordionTrigger className="text-white hover:text-purple-300">What fees does 7affle charge?</AccordionTrigger>
              <AccordionContent className="text-gray-300">
                7affle charges a 5% platform fee on all raffles. This fee is automatically deducted when 
                prizes are distributed. The fee helps maintain the platform, develop new features, and ensure 
                the long-term sustainability of the service.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
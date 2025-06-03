import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAnchorProvider } from '../../components/solana/use-anchor-provider'
import { SEVEN_TOKEN_MINT_ADDRESS } from '../../../token/seven-token/utils/token-exports'
import { transferTokens } from '@/services/token-service'
import { toast } from 'sonner'

export function TokenActions() {
  const { publicKey } = useWallet()
  const provider = useAnchorProvider()
  
  const [recipientAddress, setRecipientAddress] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleTransfer = async () => {
    if (!recipientAddress || !transferAmount || !publicKey || !provider) {
      toast.error('Please fill all fields and connect your wallet');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log(`Initiating transfer of ${transferAmount} $7F tokens`);
      console.log(`From: ${publicKey.toString()}`);
      console.log(`To: ${recipientAddress}`);
      console.log(`Token: ${SEVEN_TOKEN_MINT_ADDRESS.toString()}`);
      
      // Call the real transferTokens function that creates and sends a blockchain transaction
      const signature = await transferTokens(provider, recipientAddress, transferAmount);
      
      console.log('Transfer transaction successful:', signature);
      
      // Display success toast with transaction explorer link
      toast.success(
        <div className="flex flex-col">
          <span>Transfer successful!</span>
          <a 
            href={`https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=${encodeURIComponent(provider.connection.rpcEndpoint)}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            View transaction
          </a>
        </div>
      );
      
      // Reset form after successful transfer
      setRecipientAddress('');
      setTransferAmount('');
    } catch (error) {
      console.error('Transfer failed:', error);
      
      // Provide more detailed error message
      if (error instanceof Error) {
        toast.error(`Transfer failed: ${error.message}`);
      } else {
        toast.error('Transfer failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Card className="p-6 bg-gray-800/40 border border-gray-700/50">
      <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Recipient Address
              </label>
              <Input 
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Enter Solana address"
                className="bg-gray-900/50 border-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Amount
              </label>
              <div className="relative">
                <Input 
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-gray-900/50 border-gray-700 pr-12"
                  type="number"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <span className="text-gray-400">$7F</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                No transaction fees - standard SPL token transfer
              </p>
            </div>
            
            <Button
              onClick={handleTransfer}
              disabled={isProcessing || !recipientAddress || !transferAmount}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Transfer $7F'
              )}
            </Button>
          </div>
    </Card>
  )
}

import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useEffect, useState } from 'react'
import { generateTransactionHistory, TransactionData } from '@/services/token-service'
import { toast } from 'sonner'

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      try {
        // Fetch transaction history from the blockchain via our service
        const txHistory = await generateTransactionHistory()
        setTransactions(txHistory)
      } catch (error) {
        console.error('Error fetching transaction history:', error)
        toast.error('Failed to load transaction history')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTransactions()
    
    // Set up refresh interval (every 2 minutes)
    const refreshInterval = setInterval(() => {
      // Add timestamp check to prevent excessive refreshes
      const lastRefresh = localStorage.getItem('lastTxHistoryRefresh')
      const now = Date.now()
      if (!lastRefresh || now - parseInt(lastRefresh) > 30000) { // 30 second cooldown
        localStorage.setItem('lastTxHistoryRefresh', now.toString())
        fetchTransactions()
      }
    }, 120000) // 2 minutes
    
    return () => clearInterval(refreshInterval)
  }, [])

  return (
    <Card className="p-6 bg-gray-800/40 border border-gray-700/50">
      <h3 className="text-xl font-bold text-white mb-4">Recent Transactions</h3>
      
      {loading ? (
        // Loading state
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-400">Loading transaction history...</p>
        </div>
      ) : transactions.length === 0 ? (
        // No transactions state
        <div className="p-8 text-center text-gray-400">
          <p>No transaction history found</p>
        </div>
      ) : (
        // Transaction data display
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-700/50">
                  <TableHead className="text-purple-300">Type</TableHead>
                  <TableHead className="text-purple-300">Amount</TableHead>
                  <TableHead className="text-purple-300">Date</TableHead>
                  <TableHead className="text-purple-300">Tx Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx, i) => (
                  <TableRow key={i} className="border-b border-gray-800">
                    <TableCell className={`font-medium ${tx.type === 'Buy' ? 'text-green-400' : tx.type === 'Sell' ? 'text-red-400' : 'text-gray-300'}`}>
                      {tx.type}
                    </TableCell>
                    <TableCell className="text-white">{tx.amount}</TableCell>
                    <TableCell className="text-gray-400">{tx.date}</TableCell>
                    <TableCell className="text-blue-400">
                      <a href={`https://explorer.solana.com/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {tx.txHash}
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 text-center">
            <a href="#" className="text-sm text-purple-400 hover:underline">
              View All Transactions →
            </a>
          </div>
        </>
      )}
    </Card>
  )
}

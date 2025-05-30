import { format, formatDistanceToNow } from 'date-fns'
import { useBasicProgram } from './basic-data-access'
import { ellipsify } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function RaffleHistory() {
  const { fetchRaffleHistory } = useBasicProgram()
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 10
  
  if (fetchRaffleHistory.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <span className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></span>
      </div>
    )
  }
  
  if (fetchRaffleHistory.isError) {
    return (
      <div className="bg-red-900/30 p-6 rounded-xl border border-red-800 max-w-3xl mx-auto">
        <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading History</h3>
        <p className="text-white">Unable to load raffle history. Please try again later.</p>
      </div>
    )
  }
  
  const historyRecords = fetchRaffleHistory.data || []
  
  // Calculate pagination indexes
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = historyRecords.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(historyRecords.length / recordsPerPage)
  
  // Function to change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)
  
  if (historyRecords.length === 0) {
    return (
      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 max-w-3xl mx-auto text-center">
        <h3 className="text-xl font-medium text-gray-300 mb-2">No Completed Raffles</h3>
        <p className="text-gray-400">Raffles will appear here after prizes have been claimed.</p>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold text-white mb-6">Raffle History</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs uppercase bg-gray-700 text-gray-300">
            <tr>
              <th scope="col" className="px-4 py-3 rounded-tl-lg">Raffle ID</th>
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">End Date</th>
              <th scope="col" className="px-4 py-3">Tickets</th>
              <th scope="col" className="px-4 py-3">Prize</th>
              <th scope="col" className="px-4 py-3">Winner</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 rounded-tr-lg">Transaction</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((record, index) => (
              <tr key={record.raffleId} className={`border-b border-gray-700 ${index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/60'} hover:bg-gray-700/60`}>
                <td className="px-4 py-3">
                  <span className="bg-purple-900/60 text-purple-300 text-xs font-medium px-2.5 py-1 rounded-md">
                    {record.raffleId}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-white">{record.raffleName}</td>
                <td className="px-4 py-3">
                  <div>
                    <div>{format(record.endTimestamp, 'MMM d, yyyy')}</div>
                    <div className="text-xs text-gray-400">{formatDistanceToNow(record.endTimestamp, { addSuffix: true })}</div>
                  </div>
                </td>
                <td className="px-4 py-3">{record.totalTicketsSold} / {record.maxTickets}</td>
                <td className="px-4 py-3 text-green-400 font-medium">{record.finalPrizeAmount.toFixed(2)} SOL</td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <span className="tooltip" data-tooltip={record.winnerAddress.toString()}>
                      {ellipsify(record.winnerAddress.toString())}
                    </span>
                    <span className="ml-2 bg-green-900/60 text-green-300 text-xs font-medium px-2 py-0.5 rounded">
                      #{record.winnerTicket}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {/* Always show claimed for records in raffle history */}
                  <span className="bg-green-900/70 text-green-300 text-xs font-medium px-2.5 py-1 rounded-full flex items-center w-fit">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                    Claimed
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a 
                    href={`https://explorer.solana.com/tx/${record.transactionSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 inline-flex items-center"
                  >
                    <span>View</span>
                    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <Button 
            onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
            disabled={currentPage === 1}
            className="bg-purple-700 hover:bg-purple-800 disabled:bg-gray-700"
            size="sm"
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <Button
                key={number}
                onClick={() => paginate(number)}
                className={`${number === currentPage 
                  ? 'bg-purple-600' 
                  : 'bg-gray-700 hover:bg-gray-600'}`}
                size="sm"
              >
                {number}
              </Button>
            ))}
          </div>
          
          <Button 
            onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
            disabled={currentPage === totalPages}
            className="bg-purple-700 hover:bg-purple-800 disabled:bg-gray-700"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

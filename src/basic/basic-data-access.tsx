import { getBasicProgram, getBasicProgramId } from '@project/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useQueryClient } from '@tanstack/react-query'
import { Cluster, LAMPORTS_PER_SOL, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState, useEffect } from 'react'
import { useCluster } from '@/components/cluster/cluster-data-access'
import { useTransactionToast } from '@/components/use-transaction-toast'
import { toast } from 'sonner'
import { useAnchorProvider } from '@/components/solana/use-anchor-provider.tsx'
import BN from 'bn.js'

// Types for our raffle platform
export interface RaffleData {
  address: PublicKey
  authority: PublicKey
  name: string
  description: string
  ticketPrice: number
  startTimestamp: number
  endTimestamp: number
  maxTickets: number
  totalTickets: number
  isActive: boolean
  winner: number | null
  winnerAddress: PublicKey | null
  raffleId: string       // New: Unique raffle ID (e.g. "7F-SOL-001")
  prizeClaimed: boolean  // Indicates if the prize has been claimed
}

// Raffle history interface
export interface RaffleHistoryData {
  raffleId: string
  raffleName: string
  creationTimestamp: number
  endTimestamp: number
  totalTicketsSold: number
  maxTickets: number
  finalPrizeAmount: number
  winnerTicket: number
  winnerAddress: PublicKey
  claimTimestamp: number
  transactionSignature: string
}

export interface TicketData {
  buyer: PublicKey
  raffle: PublicKey
  raffleName: string
  ticketNumber: number
  purchaseDate: number
  isActive: boolean
  isWinner: boolean
}

// User stats interface for leaderboard tracking
export interface UserStatsData {
  user: PublicKey
  totalTicketsPurchased: number
  weeklyTickets: number
  monthlyTickets: number
  currentWeek: number
  currentMonth: number
  isInitialized: boolean
}

export function useBasicProgram() {
  const { connection } = useConnection()
  const queryClient = useQueryClient()
  const { publicKey } = useWallet()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getBasicProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getBasicProgram(provider, programId), [provider, programId])
  const [activeRaffles, setActiveRaffles] = useState<RaffleData[]>([])
  const [myTickets, setMyTickets] = useState<TicketData[]>([])
  const [userStats, setUserStats] = useState<UserStatsData | null>(null)
  
  // Get program account metadata
  const getProgramAccount = useQuery({
    queryKey: ['program', 'metadata', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  // Initialize the program counter (only called once at program setup)
  const initializeProgramCounter = useMutation({
    mutationKey: ['counter', 'initialize', { cluster }],
    mutationFn: async () => {
      if (!publicKey) {
        throw new Error('Wallet not connected')
      }

      console.log('Initializing program counter...')
      
      try {
        // Find the PDA for the program counter
        const [programCounterPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('program-counter')],
          program.programId
        )
        
        console.log('Program counter PDA:', programCounterPDA.toString())
        
        // Store the PDA in localStorage so we can reference it later
        localStorage.setItem('programCounterAddress', programCounterPDA.toString())
        
        // Create transaction to initialize program counter
        // @ts-ignore - Add accounts with string keys to bypass TypeScript restrictions
        const accountsObj = {
          programCounter: programCounterPDA,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        }
        
        const tx = await program.methods
          .initializeProgramCounter()
          .accounts(accountsObj)
          .rpc()
          
        console.log('Program counter initialized:', tx)
        toast.success('Program counter initialized. You can now create raffles with unique IDs!')
        return tx
      } catch (error) {
        console.error('Error details:', error)
        throw error
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Program counter initialized successfully!')
    },
    onError: (error) => {
      console.error('Error initializing program counter:', error)
      toast.error(`Failed to initialize program counter: ${error.message || 'Unknown error'}`)
    }
  })

  // Initialize a new raffle
  const initializeRaffle = useMutation({
    mutationKey: ['raffle', 'initialize', { cluster }],
    mutationFn: async ({ name, description, ticketPrice, durationHours, maxTickets }: { 
      name: string
      description: string
      ticketPrice: number
      durationHours: number
      maxTickets: number
    }) => {
      try {
        if (!publicKey) {
          throw new Error('Wallet not connected')
        }

        const lamports = ticketPrice * LAMPORTS_PER_SOL
        
        // Log the parameters for debugging
        console.log('Initializing raffle with params:', {
          name,
          description,
          ticketPrice: lamports,
          durationHours,
          maxTickets,
          signer: publicKey.toString()
        })
        
        // Generate a new keypair for the raffle account
        const raffleKeypair = Keypair.generate()
        console.log('Generated raffle keypair:', raffleKeypair.publicKey.toString())
        
        // Find the PDA for the program counter - we need to use the same seed as in the contract
        const [programCounterPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('program-counter')],
          program.programId
        )
        console.log('Using program counter PDA:', programCounterPDA.toString())
        
        // Use the raw RPC method to avoid TypeScript issues
        const instructionMethodBuilder = program.methods
          .initializeRaffle(
            name,
            description,
            new BN(lamports),
            new BN(durationHours),
            maxTickets
          )
          
        // @ts-ignore - Add accounts with string keys to bypass TypeScript restrictions
        const accountsObj = {
          raffle: raffleKeypair.publicKey,
          programCounter: programCounterPDA,
          authority: publicKey,
          systemProgram: SystemProgram.programId
        }
        
        const tx = await instructionMethodBuilder
          .accounts(accountsObj)
          .signers([raffleKeypair])
          .rpc()
          
        console.log('Transaction successful:', tx)
        console.log('Raffle created at address:', raffleKeypair.publicKey.toString())
        
        // Store raffle info in localStorage for later use
        try {
          const raffleInfo = {
            address: raffleKeypair.publicKey.toString(),
            name,
            description,
            ticketPrice: lamports,
            createdAt: Date.now()
          }
          const existingRaffles = JSON.parse(localStorage.getItem('myRaffles') || '[]')
          localStorage.setItem('myRaffles', JSON.stringify([...existingRaffles, raffleInfo]))
        } catch (e) {
          console.error('Failed to save raffle info to localStorage:', e)
        }
        
        return tx
      } catch (error) {
        console.error('Error creating raffle:', error)
        throw error
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Raffle created successfully!')
      console.log('Raffle transaction signature:', signature)
    },
    onError: (error) => {
      console.error('Failed to create raffle:', error)
      toast.error(`Failed to create raffle: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })

  // Empty

  // Buy a ticket for a raffle
  const buyTicket = useMutation({
    mutationKey: ['raffle', 'buy-ticket', { cluster }],
    mutationFn: async ({ raffleAddress }: { raffleAddress: PublicKey }) => {
      if (!publicKey) {
        throw new Error('Wallet not connected')
      }

      console.log('Buying ticket for raffle:', raffleAddress.toString())
      
      // Get the raffle account to check ticket price and current ticket count
      const raffle = await program.account.raffle.fetch(raffleAddress)
      console.log('Raffle data:', raffle)
      
      // Calculate ticket PDA - it's derived from raffle address and total tickets
      const ticketNumber = raffle.totalTickets
      const [ticketPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('ticket'),
          raffleAddress.toBuffer(),
          new Uint8Array(new BN(ticketNumber).toArray('le', 4))
        ],
        programId
      )

      console.log('Ticket PDA:', ticketPDA.toString())
      console.log('Ticket price:', raffle.ticketPrice.toString(), 'lamports')
      
      // Use raw object with string keys to bypass TypeScript restrictions
      // @ts-ignore - Add accounts with string keys to bypass TypeScript restrictions
      const accounts = {
        raffle: raffleAddress,
        buyer: publicKey,
        ticket: ticketPDA,
        systemProgram: SystemProgram.programId
      }

      const tx = await program.methods
        .buyTicket()
        .accounts(accounts)
        .rpc()

      console.log('Ticket purchased! Transaction signature:', tx)
      return tx
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Ticket purchased successfully!')
      // Refetch raffles and tickets to update the UI
      fetchRaffles.refetch()
      fetchMyTickets.refetch()
    },
    onError: (error) => {
      console.error('Failed to buy ticket:', error)
      toast.error(`Failed to buy ticket: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  // Draw a winner for the raffle
  const drawWinner = useMutation({
    mutationKey: ['raffle', 'draw-winner', { cluster }],
    mutationFn: async ({ raffleAddress }: { raffleAddress: PublicKey }) => {
      if (!publicKey) {
        throw new Error('Wallet not connected')
      }
      
      console.log('Drawing winner for raffle:', raffleAddress.toString())
      
      try {
        // Get the raffle data to check its current state
        const raffle = await program.account.raffle.fetch(raffleAddress)
        console.log('Raffle state before drawing winner:', raffle)
        
        // Verify the raffle has tickets and has ended or is sold out
        if (raffle.totalTickets === 0) {
          throw new Error('No tickets have been sold for this raffle')
        }
        
        // Prepare transaction to draw winner
        // @ts-ignore - Add accounts with string keys to bypass TypeScript restrictions
        const accountsObj = {
          raffle: raffleAddress,
          authority: publicKey,
        }
        
        console.log('Drawing winner with accounts:', accountsObj)
        
        const tx = await program.methods
          .drawWinner()
          .accounts(accountsObj)
          .rpc()
          
        console.log('Winner drawn! Transaction signature:', tx)
        return tx
      } catch (error) {
        console.error('Error drawing winner:', error)
        throw error
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Winner drawn successfully!')
      // Refetch raffles to update the UI
      fetchRaffles.refetch()
    },
    onError: (error) => {
      console.error('Failed to draw winner:', error)
      toast.error(`Failed to draw winner: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  // Claim prize
  const claimPrize = useMutation({
    mutationKey: ['raffle', 'claim-prize', { cluster }],
    mutationFn: async ({ raffleAddress, ticketNumber }: { 
      raffleAddress: PublicKey
      ticketNumber: number
    }) => {
      if (!publicKey) {
        throw new Error('Wallet not connected')
      }
      
      console.log('Claiming prize for raffle:', raffleAddress.toString(), 'with ticket number:', ticketNumber)
      
      // First, get the raffle data to verify winner
      let raffle = await program.account.raffle.fetch(raffleAddress)
      
      // Get all tickets for this raffle to check edge cases
      const allRaffleTickets = await program.account.ticket.all([
        {
          memcmp: {
            offset: 8 + 32, // Skip discriminator (8) and buyer field (32)
            bytes: raffleAddress.toBase58()
          }
        }
      ])
      
      const isSoldOut = raffle.totalTickets === raffle.maxTickets
      const allTicketsFromSameWallet = allRaffleTickets.every(t => t.account.buyer.equals(publicKey))
      
      console.log('Raffle state:', {
        isSoldOut,
        allTicketsFromSameWallet,
        totalTickets: raffle.totalTickets,
        maxTickets: raffle.maxTickets,
        hasWinner: raffle.winner !== null
      })
      
      // Special case: If all tickets are owned by the same wallet and raffle is sold out
      // We should consider this user the winner even if winner isn't explicitly set
      if (isSoldOut && allTicketsFromSameWallet && raffle.totalTickets > 0) {
        console.log('Special case: All tickets owned by same wallet in sold-out raffle')
        // Continue with claim process even without an explicit winner
        
        // Auto-draw the winner if needed
        if (!raffle.winner) {
          console.log('Auto-drawing winner for sold-out raffle with single buyer')
          try {
            // Try to draw the winner first
            await program.methods
              .drawWinner()
              .accounts({
                raffle: raffleAddress,
                authority: publicKey
              })
              .rpc()
            
            // Fetch the updated raffle data with the winner
            const updatedRaffle = await program.account.raffle.fetch(raffleAddress)
            if (updatedRaffle.winner === null) {
              throw new Error('Failed to auto-draw winner')
            }
            
            // Update our local reference
            raffle = updatedRaffle
            console.log('Successfully auto-drew winner:', updatedRaffle.winner)
          } catch (e) {
            console.error('Error auto-drawing winner:', e)
            // Continue anyway since this is a special case
          }
        }
      } else if (!raffle.winner) {
        // Standard case - require an explicit winner
        throw new Error('No winner has been drawn for this raffle yet')
      }
      
      // Special case check - when all tickets are from same wallet, any ticket can be the winner
      const isSpecialCase = isSoldOut && allTicketsFromSameWallet && raffle.totalTickets > 0
      
      if (!isSpecialCase && raffle.winner !== ticketNumber) {
        throw new Error(`Ticket #${ticketNumber} is not the winning ticket for this raffle`)
      }
      
      // Find the ticket account for this ticket number
      console.log('Looking for ticket account with number:', ticketNumber)
      const ticketAccounts = await program.account.ticket.all([
        {
          memcmp: {
            offset: 8 + 32, // Skip discriminator (8) and buyer field (32)
            bytes: raffleAddress.toBase58()
          }
        }
      ])
      
      const winningTicket = ticketAccounts.find(
        account => account.account.ticketNumber === ticketNumber
      )
      
      if (!winningTicket) {
        throw new Error(`Could not find ticket #${ticketNumber} for this raffle`)
      }
      
      // Verify the current user is the owner of this ticket
      if (!winningTicket.account.buyer.equals(publicKey)) {
        throw new Error('You are not the owner of this winning ticket')
      }
      
      console.log('Found winning ticket:', winningTicket.publicKey.toString())
      console.log('Winning ticket owner:', winningTicket.account.buyer.toString())
      
      // Set up the accounts for the claim prize transaction
      // Create a new raffle history account
      const historyKeypair = Keypair.generate()
      console.log('Generated history keypair:', historyKeypair.publicKey.toString())
      
      // @ts-ignore - Add accounts with string keys to bypass TypeScript restrictions
      const accountsObj = {
        raffle: raffleAddress,
        winner: publicKey,
        winningTicket: winningTicket.publicKey,
        authority: raffle.authority, // This should be the raffle admin who receives the platform fee
        raffleHistory: historyKeypair.publicKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      }
      
      console.log('Claiming prize with accounts:', accountsObj)
      
      // If the raffle doesn't have a winner yet, try to draw one automatically
      if (raffle.winner === null) {
        console.log('No winner drawn yet, attempting to draw winner automatically...')
        try {
          // Check if raffle is eligible for auto-drawing (sold out or ended)
          const now = Math.floor(Date.now() / 1000) // Current time in seconds
          const isEnded = now >= raffle.endTimestamp.toNumber()
          const isSoldOut = raffle.totalTickets >= raffle.maxTickets
          
          if (isEnded || isSoldOut) {
            // Try to draw winner first
            const drawTx = await program.methods
              .drawWinner()
              .accounts({
                raffle: raffleAddress,
                authority: publicKey
              })
              .rpc()
              
            console.log('Auto-drew winner! Transaction signature:', drawTx)
            
            // Refresh raffle data
            raffle = await program.account.raffle.fetch(raffleAddress)
            if (raffle.winner === null) {
              throw new Error('Failed to draw a winner automatically')
            }
          } else {
            throw new Error('Raffle is not eligible for auto-drawing (not ended or sold out)')
          }
        } catch (e) {
          console.error('Error auto-drawing winner:', e)
          throw new Error('No winner has been drawn for this raffle yet. Please ask the admin to draw a winner first.')
        }
      }

      // Now claim the prize
      const tx = await program.methods
        .claimPrize()
        .accounts(accountsObj)
        .signers([historyKeypair])
        .rpc()
        
      // Since we don't have a way to update the transaction signature in the raffle history record,
      // we'll store it in local storage or in a database in a real-world scenario.
      // For now, we'll just log it and store it in memory for the current session
      console.log('Prize claimed with transaction signature:', tx)
      
      // Store the claimed status in our data access layer
      // This will be reflected in the UI until the page is refreshed
      queryClient.setQueryData(['raffles'], (oldData: RaffleData[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(r => {
          // Ensure we're comparing strings with strings
          const raffleAddressStr = raffleAddress.toBase58();
          if (r.address === raffleAddressStr) {
            return { ...r, prizeClaimed: true };
          }
          return r;
        });
      });
      
      console.log('Prize claimed! Transaction signature:', tx)
      return tx
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Prize claimed successfully! Check your wallet balance.')
      // Refetch data to update UI
      fetchRaffles.refetch()
      fetchMyTickets.refetch()
    },
    onError: (error) => {
      console.error('Failed to claim prize:', error)
      toast.error(`Failed to claim prize: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  // Cancel a raffle (only works if no tickets have been sold)
  const cancelRaffle = useMutation({
    mutationKey: ['raffle', 'cancel', { cluster }],
    mutationFn: async ({ raffleAddress }: { raffleAddress: PublicKey }) => {
      if (!publicKey) {
        throw new Error('Wallet not connected')
      }
      
      console.log('Canceling raffle:', raffleAddress.toString())
      
      // Use the program method to cancel a raffle
      const tx = await program.methods
        .cancelRaffle()
        .accounts({
          raffle: raffleAddress,
          authority: publicKey,
        })
        .rpc()
      
      console.log('Raffle canceled successfully:', tx)
      return tx
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      // Refetch raffles after successful cancellation
      fetchRaffles.refetch()
      toast.success('Raffle canceled successfully!')
    },
    onError: (error) => {
      console.error('Error canceling raffle:', error)
      toast.error('Failed to cancel raffle. Make sure no tickets have been sold.')
    }
  })

  // Fetch raffle history records
  const fetchRaffleHistory = useQuery({
    queryKey: ['raffle', 'history', { cluster }],
    queryFn: async () => {
      try {
        console.log('Fetching raffle history records...')
        
        // Get all program accounts of type RaffleHistory
        // Handle case where RaffleHistory might not exist in older contracts
        let historyAccounts: any[] = []
        try {
          // @ts-ignore - The property might not exist on older contracts
          historyAccounts = await program.account.raffleHistory?.all() || []
        } catch (e) {
          console.log('RaffleHistory account type not found (expected for older contracts)')
        }
        
        console.log(`Found ${historyAccounts.length} raffle history accounts:`, historyAccounts)
        
        // Convert the raw data to our interface format
        const historyRecords = historyAccounts.map((account: any) => {
          const history = account.account
          
          return {
            raffleId: history.raffleId,
            raffleName: history.raffleName,
            creationTimestamp: history.creationTimestamp.toNumber() * 1000,
            endTimestamp: history.endTimestamp.toNumber() * 1000,
            totalTicketsSold: history.totalTicketsSold,
            maxTickets: history.maxTickets,
            finalPrizeAmount: history.finalPrizeAmount.toNumber() / LAMPORTS_PER_SOL,
            winnerTicket: history.winnerTicket,
            winnerAddress: history.winnerAddress,
            claimTimestamp: history.claimTimestamp.toNumber() * 1000,
            transactionSignature: history.transactionSignature
          } as RaffleHistoryData
        })
        
        // Sort by claim time (most recent first)
        historyRecords.sort((a: RaffleHistoryData, b: RaffleHistoryData) => 
          b.claimTimestamp - a.claimTimestamp
        )
        
        console.log('Processed history records:', historyRecords)
        return historyRecords
      } catch (error) {
        console.error('Error fetching raffle history:', error)
        return [] as RaffleHistoryData[]
      }
    },
    // Refetch every 60 seconds (less frequent than active raffles)
    refetchInterval: 60000
  })

  // Fetch all active raffles
  const fetchRaffles = useQuery({
    queryKey: ['raffle', 'all', { cluster }],
    queryFn: async () => {
      try {
        console.log('Fetching raffle accounts...')
        
        // Get all program accounts of type Raffle
        const raffleAccounts = await program.account.raffle.all()
        console.log(`Found ${raffleAccounts.length} raffle accounts:`, raffleAccounts)
        
        // Get all ticket accounts to find winner addresses
        const ticketAccounts = await program.account.ticket.all()
        console.log(`Found ${ticketAccounts.length} ticket accounts`)
        
        // Get all raffle history accounts to check if prizes have been claimed
        let historyAccounts: any[] = []
        try {
          // @ts-ignore - The property might not exist on older contracts
          historyAccounts = await program.account.raffleHistory?.all() || []
          console.log(`Found ${historyAccounts.length} raffle history accounts`)
        } catch (e) {
          console.log('RaffleHistory account type not found (expected for older contracts)')
        }
        
        // Convert the raw data to our interface format
        const raffles = raffleAccounts.map(account => {
          const raffle = account.account
          const address = account.publicKey
          const now = Date.now()
          const startTimestamp = raffle.startTimestamp.toNumber() * 1000
          const endTimestamp = raffle.endTimestamp.toNumber() * 1000
          
          // Try to find the winner's address if there is a winner
          let winnerAddress: PublicKey | null = null
          if (raffle.winner !== null) {
            const winningTicket = ticketAccounts.find(
              ta => ta.account.ticketNumber === raffle.winner && ta.account.raffle.equals(address)
            )
            if (winningTicket) {
              winnerAddress = winningTicket.account.buyer
            }
          }
          
          // Handle both old and new contract versions
          const raffleId = 'raffleId' in raffle ? 
            raffle.raffleId : 
            `Unknown-${address.toString().slice(0, 6)}`;
          
          // Check if prize has been claimed by looking for a matching raffle history record
          // A prize is considered claimed if there's a raffle history record with a matching raffleId
          const prizeClaimed = historyAccounts.some(history => 
            // Either match by raffleId or by address
            (history.account.raffleId === raffleId) || 
            // For older contracts that might not have raffleId, try to match by other fields
            (history.account.winnerTicket === raffle.winner && 
             history.account.totalTicketsSold === raffle.totalTickets &&
             history.account.maxTickets === raffle.maxTickets)
          )
          
          return {
            address,
            authority: raffle.authority,
            name: raffle.name,
            description: raffle.description,
            ticketPrice: raffle.ticketPrice.toNumber() / LAMPORTS_PER_SOL,
            startTimestamp,
            endTimestamp,
            maxTickets: raffle.maxTickets,
            totalTickets: raffle.totalTickets,
            winner: raffle.winner,
            winnerAddress,
            isActive: raffle.isActive && (now < endTimestamp),
            raffleId: raffleId,
            prizeClaimed: prizeClaimed
          } as RaffleData
        })
        
        // Sort raffles by end time (most recent first)
        raffles.sort((a, b) => b.endTimestamp - a.endTimestamp)
        
        console.log('Processed raffles:', raffles)
        return raffles
      } catch (error) {
        console.error('Error fetching raffles:', error)
        return [] as RaffleData[]
      }
    },
    // Refetch every 30 seconds
    refetchInterval: 30000
  })

  // Update state when raffles data changes
  useEffect(() => {
    if (fetchRaffles.data) {
      setActiveRaffles(fetchRaffles.data)
    }
  }, [fetchRaffles.data])

  // Fetch tickets owned by current user
  const fetchMyTickets = useQuery({
    queryKey: ['raffle', 'my-tickets', { cluster, publicKey }],
    queryFn: async () => {
      if (!publicKey) return []
      
      try {
        console.log('Fetching user tickets from blockchain...')
        
        // Get all ticket accounts owned by the current user
        const ticketAccounts = await program.account.ticket.all([
          {
            memcmp: {
              offset: 8, // Skip the discriminator
              bytes: publicKey.toBase58()
            }
          }
        ])
        
        console.log(`Found ${ticketAccounts.length} ticket accounts:`, ticketAccounts)
        
        // Map the raw accounts to our TicketData interface
        const userTickets: TicketData[] = await Promise.all(
          ticketAccounts.map(async (account) => {
            const ticket = account.account
            const raffleAddress = ticket.raffle
            
            // Try to find raffle info in our active raffles cache
            let raffleName = 'Completed Raffle'
            let isActive = false
            let isWinner = false
            let purchaseDate = Date.now() // Default to now if we can't determine
            
            // First look in our active raffles cache
            const raffleInfo = activeRaffles.find(r => r.address.equals(raffleAddress))
            
            if (raffleInfo) {
              raffleName = raffleInfo.name
              isActive = raffleInfo.isActive
              // Check if this ticket is a winner - either the winner is explicitly set, or
              // this is the only ticket in a sold-out raffle
              isWinner = raffleInfo.winner === ticket.ticketNumber
              // Special case: If raffle is sold out and there's only one buyer (you), you're the winner
              const isSoldOut = raffleInfo.totalTickets === raffleInfo.maxTickets
              const isOnlyBuyer = raffleInfo.totalTickets === 1 || 
                (isSoldOut && !raffleInfo.isActive && raffleInfo.winner === null)
              
              if (isOnlyBuyer && isSoldOut) {
                console.log('Only buyer for sold-out raffle detected - marking as winner', ticket)
                isWinner = true
              }
              
              purchaseDate = raffleInfo.startTimestamp + 3600000 // Estimate: 1 hour after start
            } else {
              // If not in cache, fetch it from blockchain
              try {
                const raffleAccount = await program.account.raffle.fetch(raffleAddress)
                raffleName = raffleAccount.name
                isActive = raffleAccount.isActive
                isWinner = raffleAccount.winner === ticket.ticketNumber
                purchaseDate = raffleAccount.startTimestamp.toNumber() * 1000 + 3600000
              } catch (e) {
                console.warn(`Could not fetch raffle info for ${raffleAddress.toString()}`, e)
              }
            }
            
            return {
              buyer: ticket.buyer,
              raffle: raffleAddress,
              raffleName,
              ticketNumber: ticket.ticketNumber,
              purchaseDate,
              isActive,
              isWinner
            }
          })
        )
        
        console.log('Processed user tickets:', userTickets)
        return userTickets
      } catch (error) {
        console.error('Error fetching user tickets:', error)
        return [] as TicketData[]
      }
    },
    enabled: !!publicKey,
    // Refetch when active raffles change
    refetchOnMount: true,
    refetchOnWindowFocus: true
  })
  
  // Update state when tickets data changes
  useEffect(() => {
    if (fetchMyTickets.data) {
      setMyTickets(fetchMyTickets.data)
    }
  }, [fetchMyTickets.data])
  
  // Initialize user stats
  const initializeUserStats = useMutation({
    mutationKey: ['user-stats', 'initialize', { cluster, publicKey }],
    mutationFn: async () => {
      if (!publicKey || !program || !provider) {
        throw new Error('Wallet not connected or program not loaded')
      }
      
      console.log('Initializing user stats for address:', publicKey.toString())
      
      try {
        // Find the PDA for user stats
        const [userStatsPda] = await PublicKey.findProgramAddressSync(
          [Buffer.from('user-stats'), publicKey.toBuffer()],
          program.programId
        )
        
        console.log('User stats PDA:', userStatsPda.toString())
        
        // Call the initialize_user_stats instruction
        // @ts-ignore - Method exists in the contract but not in the TypeScript definitions
        const tx = await program.methods
          .initializeUserStats()
          .accounts({
            userStats: userStatsPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc()
          
        console.log('User stats initialized:', tx)
        // Invalidate queries that depend on user stats
        queryClient.invalidateQueries({ queryKey: ['user-stats', { cluster, publicKey }] })
        return tx
      } catch (error) {
        console.error('Error initializing user stats:', error)
        throw error
      }
    },
    onSuccess: (signature) => {
      // @ts-ignore - Type definitions for transactionToast are incorrect
      transactionToast({ signature })
      toast.success('User profile initialized successfully!')
    },
    onError: (error) => {
      console.error('Error initializing user stats:', error)
      toast.error('Failed to initialize user profile')
    }
  })
  
  // Fetch user stats
  const fetchUserStats = useQuery({
    queryKey: ['user-stats', { cluster, publicKey }],
    queryFn: async () => {
      if (!publicKey || !program) {
        return null
      }
      
      try {
        // Find the PDA for user stats
        const [userStatsPda] = await PublicKey.findProgramAddressSync(
          [Buffer.from('user-stats'), publicKey.toBuffer()],
          program.programId
        )
        
        console.log('Looking for user stats at PDA:', userStatsPda.toString())
        
        try {
          // Try to fetch user stats
          const userStatsAccount = await program.account.userStats.fetch(userStatsPda)
          
          // Map to our interface
          const userStatsData: UserStatsData = {
            user: userStatsAccount.user,
            totalTicketsPurchased: userStatsAccount.totalTicketsPurchased,
            weeklyTickets: userStatsAccount.weeklyTickets,
            monthlyTickets: userStatsAccount.monthlyTickets,
            currentWeek: userStatsAccount.currentWeek,
            currentMonth: userStatsAccount.currentMonth,
            isInitialized: true
          }
          
          console.log('User stats found:', userStatsData)
          return userStatsData
        } catch (error) {
          // If account not found, return a default with isInitialized: false
          console.log('User stats not initialized yet:', error)
          return {
            user: publicKey,
            totalTicketsPurchased: 0,
            weeklyTickets: 0,
            monthlyTickets: 0,
            currentWeek: 0,
            currentMonth: 0,
            isInitialized: false
          }
        }
      } catch (error) {
        console.error('Error fetching user stats:', error)
        return null
      }
    },
    enabled: !!publicKey && !!program,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  })
  
  // Update user stats state when data changes
  useEffect(() => {
    if (fetchUserStats.data) {
      setUserStats(fetchUserStats.data)
    }
  }, [fetchUserStats.data])

  // Fetch leaderboard data
  const fetchLeaderboard = useQuery({
    queryKey: ['leaderboard', { cluster }],
    queryFn: async () => {
      if (!program) return { weekly: [], monthly: [] }
      
      try {
        console.log('Fetching leaderboard data from blockchain...')
        
        // Get all user stats accounts
        const userStatsAccounts = await program.account.userStats.all()
        
        console.log(`Found ${userStatsAccounts.length} user stats accounts`)
        
        // Map to our interface and sort by ticket count
        const userStatsData: UserStatsData[] = userStatsAccounts.map(account => ({
          user: account.account.user,
          totalTicketsPurchased: account.account.totalTicketsPurchased,
          weeklyTickets: account.account.weeklyTickets,
          monthlyTickets: account.account.monthlyTickets,
          currentWeek: account.account.currentWeek,
          currentMonth: account.account.currentMonth,
          isInitialized: true
        }))
        
        // Sort by weekly and monthly tickets
        const weeklyLeaderboard = [...userStatsData].sort(
          (a, b) => b.weeklyTickets - a.weeklyTickets
        )
        
        const monthlyLeaderboard = [...userStatsData].sort(
          (a, b) => b.monthlyTickets - a.monthlyTickets
        )
        
        return {
          weekly: weeklyLeaderboard,
          monthly: monthlyLeaderboard
        }
      } catch (error) {
        console.error('Error fetching leaderboard data:', error)
        return { weekly: [], monthly: [] }
      }
    },
    enabled: !!program,
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true
  })

  return {
    program,
    programId,
    provider,
    getProgramAccount,
    initializeProgramCounter,
    initializeRaffle,
    buyTicket,
    drawWinner,
    claimPrize,
    cancelRaffle,
    fetchRaffles,
    fetchMyTickets,
    fetchRaffleHistory,
    fetchUserStats,
    fetchLeaderboard,
    initializeUserStats,
    activeRaffles,
    myTickets,
    userStats,
  }
}

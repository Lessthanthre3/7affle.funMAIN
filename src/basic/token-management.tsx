import React, { useState, useEffect } from 'react'
import { BN } from '@coral-xyz/anchor'
import { useAnchorProvider } from '@/components/solana/use-anchor-provider'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  initializeTokenMint, 
  getMintKeypair, 
  getSevenTokenProgram,
  findTokenConfigPDA,
  // Removed findReflectionTrackerPDA since it's no longer needed
  SEVEN_TOKEN_PROGRAM_ID,
  SEVEN_TOKEN_MINT_ADDRESS
} from '../../token/seven-token/utils/token-exports'
import { mintInitialSupply } from '../../token/seven-token/utils/mint-tokens'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { TabsContent, TabsList, TabsTrigger, Tabs } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertCircle, 
  CheckCircle2, 
  Coins, 
  Settings,
  RefreshCcw 
} from 'lucide-react'
import { ellipsify } from '@/lib/utils'
import { 
  TOKEN_PROGRAM_ID,
  getMint,
  getOrCreateAssociatedTokenAccount
} from '@solana/spl-token'

// Token constants
const DEFAULT_DECIMALS = 6
const TOTAL_SUPPLY_DEFAULT = new BN(1_000_000_000).mul(
  new BN(10).pow(new BN(DEFAULT_DECIMALS))
) // 1 billion tokens (fixed supply)

export function TokenManagement(): React.ReactElement {
  const provider = useAnchorProvider()
  const { publicKey, connected, signTransaction } = useWallet()
  // Using default cluster from context
  
  // Token data states
  const [tokenMint, setTokenMint] = useState<PublicKey | null>(null)
  const [tokenDecimals, setTokenDecimals] = useState(DEFAULT_DECIMALS)
  const [tokenSupply, setTokenSupply] = useState('')
  const [totalSupply, setTotalSupply] = useState(TOTAL_SUPPLY_DEFAULT.toString())
  const [mintInitialized, setMintInitialized] = useState(false)
  const [configInitialized, setConfigInitialized] = useState(false)
  const [excludedAddresses, setExcludedAddresses] = useState<string[]>([])
  const [excludedFromRewardsAddresses, setExcludedFromRewardsAddresses] = useState<string[]>([])
  
  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [progressPercent, setProgressPercent] = useState(0)
  
  // Form inputs
  const [treasuryAddress, setTreasuryAddress] = useState('')
  const [excludeAddress, setExcludeAddress] = useState('')
  const [excludeRewardsAddress, setExcludeRewardsAddress] = useState('')
  
  // For last transaction status
  const [_, setLastTxId] = useState<string>('')  // Using underscore for unused variable
  
  // Authority status
  const [mintAuthority, setMintAuthority] = useState<string | null>(null)
  const [freezeAuthority, setFreezeAuthority] = useState<string | null>(null)
  
  // Check if user is admin
  useEffect(() => {
    setIsAdmin(
      publicKey?.toString() === 'GrDWUZZpCsxXR8qnZXREmE3bDgkQxLG6BHve3NLPbHFR' ||
      publicKey?.toString() === 'ALo5Qhjy46wVCXnD4osQXTq6ufF5MZ9uhxARAy7affLe' ||
      publicKey?.toString() === 'ACZfNEpJUufGH5MhpUAmoNkCRTpP2KkGhZXeNX1q9UXT' ||
      publicKey?.toString() === 'GhSwQL8opHBhE8PNog9ZGbuzTVdhPMEr5JJTHZQ9GRHq'
    )
  }, [publicKey])
  
  // Get program and PDAs once
  const mintAddress = new PublicKey(SEVEN_TOKEN_MINT_ADDRESS)
  const programId = SEVEN_TOKEN_PROGRAM_ID
  const [tokenConfigPDA] = findTokenConfigPDA(programId)
  // No longer need reflectionTrackerPDA since we removed reflection features
  const program = provider ? getSevenTokenProgram(provider) : null
  
  // Initialize with mint from token exports
  useEffect(() => {
    if (!tokenMint) {
      setTokenMint(mintAddress)
    }
  }, [])
  
  // Only load token status once on initial mount
  useEffect(() => {
    if (provider && isAdmin) {
      // Initial load only when component mounts
      console.log('Initial token status check')
      loadTokenStatus()
    }
  }, []) // Empty dependency array - only run once on mount
  
  // Add a manual refresh function for the UI with debounce
  const [refreshTimestamp, setRefreshTimestamp] = useState(0)
  
  // Refresh the token status manually
  function refreshTokenStatus() {
    const now = Date.now()
    const debounceTime = 2000 // 2 seconds
    
    // Prevent rapid refreshes
    if (now - refreshTimestamp < debounceTime) {
      console.log('Refresh attempted too quickly, ignoring')
      return
    }
    
    console.log('Manual refresh triggered')
    setRefreshTimestamp(now)
    loadTokenStatus()
  }
  
  // Note: refreshTimestamp is now used for debounce protection instead of these
  
  // Function to check and display mint authority information
  const checkMintAuthority = async () => {
    if (!provider || !tokenMint) {
      toast.error("Token mint not initialized");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get mint info
      const mintInfo = await getMint(
        provider.connection,
        new PublicKey(tokenMint)
      );
      
      // Update state with authority information
      const mintAuth = mintInfo.mintAuthority 
        ? mintInfo.mintAuthority.toBase58() 
        : 'Revoked';
      
      const freezeAuth = mintInfo.freezeAuthority 
        ? mintInfo.freezeAuthority.toBase58() 
        : 'None';
      
      setMintAuthority(mintAuth);
      setFreezeAuthority(freezeAuth);
      
      // Display mint authority info
      toast.success(`Mint Authority: ${mintAuth}`);
      console.log("Mint Authority:", mintAuth);
      console.log("Freeze Authority:", freezeAuth);
      
    } catch (error) {
      console.error("Error checking mint authority:", error);
      toast.error("Failed to check mint authority");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to permanently revoke mint authority
  const revokeMintAuthority = async () => {
    if (!provider || !tokenMint || !publicKey || !signTransaction) {
      toast.error("Token mint not initialized or wallet not connected");
      return;
    }
    
    // Ask for confirmation before proceeding
    if (!confirm("WARNING: This will permanently revoke the ability to mint new tokens. This action CANNOT be undone. Are you sure you want to proceed?")) {
      toast.info("Mint authority revocation cancelled");
      return;
    }
    
    try {
      setIsLoading(true);
      toast.info("Revoking mint authority...");
      
      // Import needed functions from spl-token
      const { createSetAuthorityInstruction, AuthorityType, TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
      const { Transaction } = await import('@solana/web3.js');
      
      const mintPubkey = new PublicKey(tokenMint);
      
      // Create the instruction to revoke mint authority
      const instruction = createSetAuthorityInstruction(
        mintPubkey,                // Mint account
        publicKey,                 // Current authority
        AuthorityType.MintTokens,  // Authority type
        null,                      // New authority (null = revoke)
        [],                        // Multi-sig signers (empty)
        TOKEN_PROGRAM_ID           // Token program ID
      );
      
      // Create and sign the transaction
      const transaction = new Transaction().add(instruction);
      transaction.feePayer = publicKey;
      
      const { blockhash } = await provider.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      
      // Sign and send the transaction
      const signedTx = await signTransaction(transaction);
      const signature = await provider.connection.sendRawTransaction(signedTx.serialize());
      
      // Wait for confirmation
      await provider.connection.confirmTransaction(signature, 'confirmed');
      
      toast.success("Mint authority has been permanently revoked!");
      console.log("Mint authority revoked, transaction:", signature);
      
      // Update the UI immediately
      setMintAuthority("Revoked");
      
      // Check mint authority to confirm
      setTimeout(() => checkMintAuthority(), 2000);
      
    } catch (error) {
      console.error("Error revoking mint authority:", error);
      toast.error(`Failed to revoke mint authority: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to mint the initial token supply to the connected wallet
  async function mintInitialTokenSupply() {
    try {
      setIsLoading(true)
      if (!provider || !publicKey || !tokenMint) {
        toast.error('Wallet not connected or token not initialized')
        return
      }
      
      // Use the total supply from the input or the default
      const supplyToMint = totalSupply || TOTAL_SUPPLY_DEFAULT
      
      // Mint the tokens to the connected wallet
      const tx = await mintInitialSupply(
        provider,
        { publicKey, signTransaction }, // wallet adapter
        tokenMint,
        publicKey, // destination wallet
        Number(supplyToMint) // amount to mint as number
      )
      
      console.log('Initial supply minted with tx:', tx)
      toast.success('Initial token supply minted successfully!')
      
      // Refresh the token status to show the updated supply
      refreshTokenStatus()
      setProgressStep(3)
      setProgressPercent(100)
    } catch (error: any) { // Type error as any for error handling
      console.error('Error minting initial supply:', error)
      toast.error(`Minting error: ${error?.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Function to check token status
  async function loadTokenStatus() {
    if (!provider || !tokenMint) return
    
    try {
      setIsLoading(true)
      
      console.log('Checking token status...')
      
      // Use local variables to avoid state sync issues
      let mintIsInitialized = false
      let configIsInitialized = false
      let decimalsValue = tokenDecimals
      let supplyValue = ''
      let excludedAddressesList: string[] = []
      let excludedFromRewardsAddressesList: string[] = []
      
      // Check if token mint exists
      try {
        const mintInfo = await getMint(provider.connection, tokenMint)
        mintIsInitialized = true
        decimalsValue = mintInfo.decimals
        supplyValue = (Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toString()
        console.log('Token mint exists with supply:', supplyValue)
        
        // Also get mint authority information
        const mintAuth = mintInfo.mintAuthority 
          ? mintInfo.mintAuthority.toBase58() 
          : 'Revoked'
        
        const freezeAuth = mintInfo.freezeAuthority 
          ? mintInfo.freezeAuthority.toBase58() 
          : 'None'
        
        setMintAuthority(mintAuth)
        setFreezeAuthority(freezeAuth)
        
      } catch (error) {
        if (error instanceof Error && !error.message.includes('not found')) {
          console.error('Error checking mint:', error)
        }
        console.log('Token mint not initialized')
      }
      
      // Check if token config is initialized
      if (program && mintIsInitialized) {
        try {
          const configAccount = await program.account.tokenConfig.fetch(tokenConfigPDA)
          if (configAccount) {
            configIsInitialized = true
            console.log('Token config initialized')
            
            // Get addresses excluded from fees
            if (configAccount.excludedFromFee && Array.isArray(configAccount.excludedFromFee)) {
              excludedAddressesList = configAccount.excludedFromFee
                .filter((addr: any) => addr !== null)
                .map((addr: any) => addr.toString())
              console.log('Fee excluded addresses loaded:', excludedAddressesList)
            }
            
            // Get addresses excluded from rewards
            if (configAccount.excludedFromRewards && Array.isArray(configAccount.excludedFromRewards)) {
              excludedFromRewardsAddressesList = configAccount.excludedFromRewards
                .filter((addr: any) => addr !== null)
                .map((addr: any) => addr.toString())
              console.log('Reward excluded addresses loaded:', excludedFromRewardsAddressesList)
            }
          }
        } catch (error) {
          console.log('Token config not initialized')
        }
      }
      
      // Set all state at once at the end
      setMintInitialized(mintIsInitialized)
      setConfigInitialized(configIsInitialized)
      setTokenDecimals(decimalsValue)
      setTokenSupply(supplyValue)
      setExcludedAddresses(excludedAddressesList)
      setExcludedFromRewardsAddresses(excludedFromRewardsAddressesList)
      
      // Update progress based on initialization status
      let progress = 0
      if (mintIsInitialized) progress = 33
      if (configIsInitialized) progress = 66
      if (mintIsInitialized && configIsInitialized && supplyValue) progress = 100
      setProgressPercent(progress)
      
      // Update progress step
      let step = 0
      if (mintIsInitialized) step = 1
      if (configIsInitialized) step = 2
      if (mintIsInitialized && configIsInitialized && supplyValue) step = 3
      setProgressStep(step)
      
    } catch (error) {
      console.error('Error loading token status:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Initialize token mint if it doesn't exist
  async function initializeTokenMintStep() {
    try {
      setIsLoading(true)
      
      if (!provider || !publicKey) {
        toast.error('Wallet not connected')
        return
      }
      
      // This follows the exact pattern from the Anchor test
      console.log('Initializing token mint...')
      
      // First ensure we have enough SOL for the transaction
      const balance = await provider.connection.getBalance(publicKey)
      if (balance < LAMPORTS_PER_SOL * 0.1) {
        console.log('Requesting airdrop for token initialization...')
        const signature = await provider.connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL)
        await provider.connection.confirmTransaction(signature, 'confirmed')
      }
      
      // Get the mint keypair 
      const mintKeypair = getMintKeypair()
      if (!mintKeypair) {
        throw new Error('Mint keypair not available')
      }
      
      // Using connected wallet as fee payer and signer
      console.log('Using connected wallet as fee payer and mint authority...')
      
      // Initialize the token mint with our updated function
      // We're passing the wallet adapter with publicKey and signTransaction
      const mintAddress = await initializeTokenMint(
        provider, 
        { publicKey, signTransaction }, 
        tokenDecimals
      )
      
      toast.success('Token mint initialized successfully')
      setMintInitialized(true)
      setTokenMint(mintAddress)
      setProgressStep(1)
      setProgressPercent(25)
      
      // Manually refresh token status
      refreshTokenStatus()
    } catch (error) {
      console.error('Error in mint initialization:', error)
      toast.error(`Mint initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Initialize token config
  async function initializeTokenConfigStep() {
    try {
      setIsLoading(true)
      
      if (!provider || !publicKey || !program || !tokenMint || !mintInitialized) {
        toast.error('Please initialize the token mint first')
        return
      }
      
      // Parse total supply from input or use default
      let totalSupplyAmount: BN
      try {
        const supplyBN = new BN(totalSupply || TOTAL_SUPPLY_DEFAULT.toString())
        // Supply should already be in proper decimals format
        totalSupplyAmount = supplyBN
        console.log('Total supply:', totalSupplyAmount.toString())
      } catch (error) {
        toast.error('Invalid supply amount')
        return
      }
      
      console.log('Initializing token config with:')
      console.log('- Total Supply:', totalSupplyAmount.toString())
      console.log('- Token Config PDA:', tokenConfigPDA.toString())
      
      // Initialize token config - follows the Anchor test pattern
      try {
        const tx = await program.methods
          .initialize(
            totalSupplyAmount  // Only passing totalSupply as parameter
          )
          .accounts({
            authority: publicKey,
            mint: tokenMint,
            tokenConfig: tokenConfigPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any) // Using 'as any' to bypass type checking as IDL might be outdated
          .rpc()
        
        console.log('Token config initialized with tx:', tx)
        toast.success('Token config initialized successfully!')
        setConfigInitialized(true)
        setProgressStep(2)
        setProgressPercent(50)
        
        // Create ATA for the user if they don't have one
        try {
          const userAta = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            { publicKey, signTransaction } as any, // Use wallet adapter for signing
            tokenMint,
            publicKey
          )
          console.log('User token account created:', userAta.address.toString())
          setProgressStep(3)
          setProgressPercent(100)
        } catch (ataError) {
          console.error('Error creating token accounts:', ataError)
          // Non-critical error, continue
        }
        
        // Reload token data
        await loadTokenStatus()
      } catch (error) {
        // Properly type check the error
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        if (errorMsg.includes('already in use')) {
          toast.info('Token config is already initialized')
          setConfigInitialized(true)
          setProgressStep(2)
          setProgressPercent(50)
          refreshTokenStatus()
        } else {
          console.error('Error initializing token config:', error)
          toast.error(`Failed to initialize token config: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error in token config initialization:', error)
      toast.error(`Config initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Exclude address from fees
  async function excludeFromFees() {
    try {
      setIsLoading(true)
      
      if (!provider || !publicKey || !program || !configInitialized) {
        toast.error('Token must be fully initialized first')
        return
      }
      
      // Basic input validation
      if (!excludeAddress.trim()) {
        toast.error('Address to exclude is required')
        return
      }
      
      let addressToExclude: PublicKey
      try {
        addressToExclude = new PublicKey(excludeAddress)
      } catch (error) {
        toast.error('Invalid address')
        return
      }
      
      // Check if address is already excluded
      if (excludedAddresses.includes(addressToExclude.toString())) {
        toast.info('Address is already excluded from fees')
        setExcludeAddress('')
        return
      }
      
      // Exclude address from fees - follows Anchor test pattern
      console.log(`Excluding address ${addressToExclude.toString()} from fees...`)
      
      const tx = await program.methods
        .excludeFromFees(addressToExclude)
        .accounts({
          authority: publicKey,
          tokenConfig: tokenConfigPDA,
        } as any)
        .rpc()
      
      console.log('Address excluded with tx:', tx)
      toast.success('Address excluded from fees successfully!')
      
      // Add to local list
      setExcludedAddresses([...excludedAddresses, addressToExclude.toString()])
      
      // Clear input
      setExcludeAddress('')
      
      // Store last transaction ID for reference
      setLastTxId(tx)
      
      // Manually refresh token status
      refreshTokenStatus()
    } catch (error) {
      console.error('Error excluding address from fees:', error)
      toast.error(`Failed to exclude address: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Exclude address from rewards
  async function excludeFromRewards() {
    try {
      setIsLoading(true)
      
      if (!provider || !publicKey || !program || !configInitialized) {
        toast.error('Token must be fully initialized first')
        return
      }
      
      // Basic input validation
      if (!excludeRewardsAddress.trim()) {
        toast.error('Address to exclude is required')
        return
      }
      
      let addressToExclude: PublicKey
      try {
        addressToExclude = new PublicKey(excludeRewardsAddress)
      } catch (error) {
        toast.error('Invalid address')
        return
      }
      
      // Check if address is already excluded
      if (excludedFromRewardsAddresses.includes(addressToExclude.toString())) {
        toast.info('Address is already excluded from rewards')
        setExcludeRewardsAddress('')
        return
      }
      
      // Exclude address from rewards
      console.log(`Excluding address ${addressToExclude.toString()} from rewards...`)
      
      const tx = await program.methods
        .excludeFromRewards(addressToExclude)
        .accounts({
          authority: publicKey,
          tokenConfig: tokenConfigPDA,
        } as any)
        .rpc()
      
      console.log('Address excluded from rewards with tx:', tx)
      toast.success('Address excluded from rewards successfully!')
      
      // Add to local list
      setExcludedFromRewardsAddresses([...excludedFromRewardsAddresses, addressToExclude.toString()])
      
      // Clear input
      setExcludeRewardsAddress('')
      
      // Store last transaction ID for reference
      setLastTxId(tx)
      
      // Manually refresh token status
      refreshTokenStatus()
    } catch (error) {
      console.error('Error excluding address from rewards:', error)
      toast.error(`Failed to exclude address from rewards: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  

  // Render admin access denied message if not admin
  if (!isAdmin) {
    return (
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>$7F Token Management</CardTitle>
          <CardDescription>
            Manage the $7F token on the Solana blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have admin privileges to manage the $7F token.
              Please connect with an admin wallet to access this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Render main token management UI for admins
  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" /> $7F Token Management
        </CardTitle>
        <CardDescription>
          Initialize, mint, and manage the $7F token on the Solana blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="initialize">Initialize</TabsTrigger>
            <TabsTrigger value="exclude">Fee Exclusions</TabsTrigger>
            <TabsTrigger value="exclude-rewards">Reward Exclusions</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Token Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2 text-sm mt-2">
                        <span>Mint Address:</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {tokenMint ? ellipsify(tokenMint.toString()) : 'Not initialized'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Decimals:</span>
                      <span className="text-sm">{tokenDecimals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Supply:</span>
                      <span className="text-sm">{Number(tokenSupply) / Math.pow(10, tokenDecimals)} $7F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Initialization:</span>
                      <span className="text-sm flex items-center gap-1">
                        {configInitialized ? (
                          <><CheckCircle2 className="h-3 w-3 text-green-500" /> Complete</>
                        ) : (
                          <><AlertCircle className="h-3 w-3 text-yellow-500" /> Incomplete</>
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-3 bg-muted/30 rounded-md p-2">
                      <div className="text-sm flex flex-col">
                        <span className="font-medium">Token Status:</span>
                        <span className="text-xs">
                          {mintInitialized && configInitialized ? (
                            <span className="text-green-500 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Fully Initialized
                            </span>
                          ) : mintInitialized ? (
                            <span className="text-yellow-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Partially Initialized
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Not Initialized
                            </span>
                          )}
                        </span>
                      </div>
                      <Button
                        onClick={refreshTokenStatus}
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={isLoading}
                      >
                        <RefreshCcw className="h-3 w-3 mr-1" />
                        {isLoading ? 'Refreshing...' : 'Refresh'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3 bg-muted/30 rounded-md p-2">
                      <div className="text-sm flex flex-col">
                        <span className="font-medium">Mint Authority:</span>
                        <span className="text-xs font-mono">
                          {mintAuthority ? ellipsify(mintAuthority) : 'Unknown'}
                        </span>
                        {freezeAuthority && (
                          <span className="text-xs mt-1">
                            <span className="font-medium">Freeze Authority:</span>{' '}
                            <span className="font-mono">{ellipsify(freezeAuthority)}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={checkMintAuthority}
                          variant="outline"
                          size="sm"
                          className="h-8"
                          disabled={isLoading || !mintInitialized}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Check Authority
                        </Button>
                        
                        {mintAuthority && mintAuthority !== 'Revoked' && (
                          <Button
                            onClick={revokeMintAuthority}
                            variant="destructive"
                            size="sm"
                            className="h-8"
                            disabled={isLoading || !mintInitialized || mintAuthority === 'Revoked'}
                          >
                            Revoke Authority
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={refreshTokenStatus}
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Refresh Token Status
                    </Button>

                    <Button
                      onClick={mintInitialTokenSupply}
                      variant="secondary"
                      className="w-full"
                      disabled={isLoading || !mintInitialized || !configInitialized || Number(tokenSupply) > 0}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                          Minting Tokens...
                        </span>
                      ) : Number(tokenSupply) > 0 ? (
                        <span className="flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                          Tokens Already Minted
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Coins className="h-4 w-4 mr-2" />
                          Mint Initial Supply
                        </span>
                      )}
                    </Button>
                    
                    {!mintInitialized && (
                      <Button 
                        onClick={initializeTokenMintStep} 
                        variant="outline" 
                        className="w-full justify-start" 
                        disabled={isLoading || !isAdmin || !connected}
                      >
                        <Coins className="mr-2 h-4 w-4" />
                        Initialize Token Mint
                      </Button>
                    )}
                    
                    {mintInitialized && !configInitialized && (
                      <Button 
                        onClick={initializeTokenConfigStep} 
                        variant="outline" 
                        className="w-full justify-start" 
                        disabled={isLoading}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Initialize Token Config
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Initialization Progress</h3>
              <div className="w-full bg-muted rounded-full h-2.5 mb-4">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className={`p-2 rounded ${progressStep >= 1 ? 'bg-primary/20' : 'bg-muted'}`}>
                  <p className="text-sm font-medium">1. Mint Initialized</p>
                </div>
                <div className={`p-2 rounded ${progressStep >= 2 ? 'bg-primary/20' : 'bg-muted'}`}>
                  <p className="text-sm font-medium">2. Token Config Created</p>
                </div>
                <div className={`p-2 rounded ${progressStep >= 3 ? 'bg-primary/20' : 'bg-muted'}`}>
                  <p className="text-sm font-medium">3. Token Accounts Ready</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Fee Exclusions Tab */}
          <TabsContent value="exclude" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fee Exclusion Management</CardTitle>
                <CardDescription>
                  Manage addresses that are excluded from paying transaction fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!configInitialized ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Token Not Initialized</AlertTitle>
                    <AlertDescription>
                      Please initialize the token configuration before managing fee exclusions.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="excludeAddress">Exclude Address From Fees</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="excludeAddress"
                          placeholder="Enter Solana address to exclude"
                          value={excludeAddress}
                          onChange={(e) => setExcludeAddress(e.target.value)}
                          disabled={isLoading}
                          className="flex-1"
                        />
                        <Button 
                          onClick={excludeFromFees} 
                          disabled={isLoading || !excludeAddress.trim()}
                        >
                          {isLoading ? (
                            <span className="flex items-center">
                              <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                              Adding...
                            </span>
                          ) : (
                            <span>Add Address</span>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Addresses on this list will not pay transaction fees when transferring $7F tokens.
                      </p>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Currently Excluded Addresses</h3>
                      {excludedAddresses.length === 0 ? (
                        <div className="text-center py-4 bg-muted/30 rounded-md">
                          <p className="text-muted-foreground text-sm">No addresses are currently excluded from fees</p>
                        </div>
                      ) : (
                        <div className="border rounded-md overflow-hidden">
                          <div className="max-h-60 overflow-y-auto">
                            {excludedAddresses.map((address, index) => (
                              <div key={index} className="p-2 flex items-center justify-between border-b last:border-0 hover:bg-muted/20">
                                <div className="font-mono text-xs overflow-hidden text-ellipsis">
                                  {address}
                                </div>
                                <Badge variant="outline" className="ml-2 shrink-0">Excluded</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={refreshTokenStatus}
                        variant="outline"
                        className="w-full"
                        disabled={isLoading}
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Refresh Excluded Addresses
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Reward Exclusions Tab */}
          <TabsContent value="exclude-rewards" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Reward Exclusion Management</CardTitle>
                <CardDescription>
                  Manage addresses that are excluded from receiving reflection rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-medium mb-2">Exclude Address From Rewards</h3>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter Solana address to exclude"
                        value={excludeRewardsAddress}
                        onChange={(e) => setExcludeRewardsAddress(e.target.value)}
                        disabled={isLoading || !configInitialized}
                      />
                      <Button 
                        onClick={excludeFromRewards}
                        disabled={isLoading || !excludeRewardsAddress || !configInitialized}
                      >
                        Add Address
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Addresses on this list will not receive reflection rewards when transfers occur.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium mb-2">Currently Excluded From Rewards</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                      {excludedFromRewardsAddresses.length > 0 ? (
                        excludedFromRewardsAddresses.map((address, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                            <span className="font-mono text-xs truncate max-w-[80%]">{address}</span>
                            <Badge variant="outline">No Rewards</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground p-2">No addresses are currently excluded from rewards.</p>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={refreshTokenStatus} 
                    variant="outline" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Refresh Excluded Addresses
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Initialize Tab */}
          <TabsContent value="initialize" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Token Initialization</CardTitle>
                <CardDescription>
                  Complete the following steps to initialize the $7F token on the blockchain
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="treasuryAddress">Treasury Address</Label>
                  <Input
                    id="treasuryAddress"
                    placeholder="Enter treasury Solana address"
                    value={treasuryAddress}
                    onChange={(e) => setTreasuryAddress(e.target.value)}
                    disabled={isLoading || configInitialized}
                  />
                  <p className="text-sm text-muted-foreground">
                    The treasury address will receive transaction fees
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="totalSupply">Total Supply</Label>
                  <Input
                    id="totalSupply"
                    placeholder="Enter total supply"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(e.target.value)}
                    disabled={isLoading || configInitialized}
                  />
                  <p className="text-sm text-muted-foreground">
                    Default is 1,000,000,000 tokens
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={initializeTokenMintStep}
                    disabled={isLoading || !isAdmin || !connected || mintInitialized}
                    className="w-full relative"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                        Initializing Mint...
                      </span>
                    ) : mintInitialized ? (
                      <span className="flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        Token Mint Initialized
                      </span>
                    ) : (
                      'Step 1: Initialize Token Mint'
                    )}
                  </Button>
                  
                  <Button
                    onClick={initializeTokenConfigStep}
                    disabled={isLoading || !mintInitialized || configInitialized}
                    className="w-full relative"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                        Initializing Config...
                      </span>
                    ) : configInitialized ? (
                      <span className="flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        Token Config Initialized
                      </span>
                    ) : (
                      'Step 2: Initialize Token Config'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  )
}

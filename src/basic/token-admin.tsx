import { useState, useEffect } from 'react'
import { useAnchorProvider } from '@/components/solana/use-anchor-provider'
import { useWallet } from '@solana/wallet-adapter-react'
import { useCluster } from '@/components/cluster/cluster-data-access'
import { 
  getSevenTokenProgram, 
  getSevenTokenProgramId, 
  findTokenConfigPDA, 
  findReflectionTrackerPDA,
  SEVEN_TOKEN_MINT_ADDRESS,
  getMintKeypair
} from '../../token/seven-token/utils/token-exports'
import { Cluster, PublicKey, SystemProgram } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { ellipsify } from '@/lib/utils'
import { 
  TOKEN_PROGRAM_ID,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo
} from '@solana/spl-token'
import { updateTokenMetadata } from '../../token/seven-token/utils/update-metadata'
import { toast } from 'sonner'

// UI Components
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Info, 
  Coins, 
  RefreshCcw, 
  ShieldCheck
} from 'lucide-react'

// Token constants
const DEFAULT_DECIMALS = 6
const TOTAL_SUPPLY_DEFAULT = new BN(7_000_000).mul(new BN(10).pow(new BN(DEFAULT_DECIMALS))) // 7 million tokens
export function TokenAdmin() {
  const provider = useAnchorProvider()
  const { publicKey, connected, signTransaction } = useWallet()
  const { cluster } = useCluster()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [tokenConfig, setTokenConfig] = useState<any>(null)
  const [reflectionTracker, setReflectionTracker] = useState<any>(null)
  const [treasuryAddress, setTreasuryAddress] = useState('')
  const [totalSupply, setTotalSupply] = useState(TOTAL_SUPPLY_DEFAULT.toString())
  const [excludeAddress, setExcludeAddress] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [excludedAddresses, setExcludedAddresses] = useState<string[]>([])
  const [tokenMint, setTokenMint] = useState<PublicKey | null>(null)
  const [tokenDecimals, setTokenDecimals] = useState<number>(DEFAULT_DECIMALS)
  
  // Check if user is admin
  const isAdmin = publicKey?.toString() === 'GrDWUZZpCsxXR8qnZXREmE3bDgkQxLG6BHve3NLPbHFR' ||
               publicKey?.toString() === 'ALo5Qhjy46wVCXnD4osQXTq6ufF5MZ9uhxARAy7affLe' ||
               publicKey?.toString() === 'ACZfNEpJUufGH5MhpUAmoNkCRTpP2KkGhZXeNX1q9UXT' ||
               publicKey?.toString() === 'GhSwQL8opHBhE8PNog9ZGbuzTVdhPMEr5JJTHZQ9GRHq'
  
  // Get program and PDAs once
  const programId = getSevenTokenProgramId(cluster.network as Cluster)
  const program = provider ? getSevenTokenProgram(provider, programId) : null
  const [tokenConfigPDA] = findTokenConfigPDA(programId)
  const [reflectionTrackerPDA] = findReflectionTrackerPDA(programId)
  
  // Initialize with mint from token exports
  useEffect(() => {
    setTokenMint(new PublicKey(SEVEN_TOKEN_MINT_ADDRESS))
  }, [])
  
  useEffect(() => {
    if (!connected || !isAdmin || !provider) return
    loadTokenData()
  }, [connected, isAdmin, provider])
  
  // Function to load token configuration and reflection data
  async function loadTokenData() {
    try {
      setIsLoading(true)
      
      if (!provider || !program || !tokenMint) {
        toast.error('Provider or program not connected')
        return
      }
      
      console.log('Seven Token Program ID:', programId.toString())
      console.log('Token Mint Address:', tokenMint.toString())
      console.log('Token Config PDA:', tokenConfigPDA.toString())
      console.log('Reflection Tracker PDA:', reflectionTrackerPDA.toString())
      
      // Get token mint info to display decimals and supply
      try {
        const mintInfo = await getMint(provider.connection, tokenMint)
        setTokenDecimals(mintInfo.decimals)
        console.log('Token mint info loaded:', mintInfo)
        console.log('Token supply:', mintInfo.supply.toString())
      } catch (error) {
        console.error('Error loading mint info:', error)
        toast.error('Failed to load token mint info')
      }
      
      // Fetch accounts
      try {
        // Fetch token config account
        const tokenConfigAcc = await program.account.tokenConfig.fetch(tokenConfigPDA)
        setTokenConfig(tokenConfigAcc)
        
        // Fetch reflection tracker account
        const reflectionTrackerAcc = await program.account.reflectionTracker.fetch(reflectionTrackerPDA)
        setReflectionTracker(reflectionTrackerAcc)
        
        // Get excluded addresses
        if (tokenConfigAcc.excludedFromFee) {
          setExcludedAddresses(tokenConfigAcc.excludedFromFee.map((addr: PublicKey) => addr.toString()))
        }
        
        // Fetch mint info if it exists
        await getMint(provider.connection, new PublicKey(SEVEN_TOKEN_MINT_ADDRESS))
        console.log('Token mint exists')
      } catch (error) {
        console.error('Error fetching accounts:', error)
        toast.error('Token not initialized yet or error fetching data')
      }
      
    } catch (err: any) {
      console.error('Error loading token data:', err)
      toast.error(`Failed to load token data: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Initialize token
  async function initializeToken() {
    try {
      setIsLoading(true)
      
      if (!provider || !publicKey || !program || !tokenMint) {
        toast.error('Wallet not connected or program not available')
        return
      }
      
      // Basic input validation
      if (!treasuryAddress.trim()) {
        toast.error('Treasury address is required')
        return
      }
      
      let treasuryPublicKey: PublicKey
      try {
        treasuryPublicKey = new PublicKey(treasuryAddress)
      } catch (error) {
        toast.error('Invalid treasury address')
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
      
      console.log('Initializing token with:')
      console.log('- Treasury:', treasuryPublicKey.toString())
      console.log('- Total Supply:', totalSupplyAmount.toString())
      console.log('- Token Config PDA:', tokenConfigPDA.toString())
      console.log('- Reflection Tracker PDA:', reflectionTrackerPDA.toString())
      
      // Initialize token config
      console.log('Initializing token config...')
      
      try {
        const tx = await program.methods
          .initialize(
            treasuryPublicKey,
            totalSupplyAmount
          )
          .accounts({
            authority: publicKey,
            mint: tokenMint,
            tokenConfig: tokenConfigPDA,
            reflectionTracker: reflectionTrackerPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .rpc()
        
        console.log('Token initialized with tx:', tx)
        toast.success('Token initialized successfully!')
        
        // Create associated token account for treasury if it doesn't exist
        const treasuryAta = await getOrCreateAssociatedTokenAccount(
          provider.connection,
          { publicKey, signTransaction } as any, // Use wallet adapter for signing
          tokenMint,
          treasuryPublicKey
        )
        console.log('Treasury token account created:', treasuryAta.address.toString())
        
        // Create token metadata with all the specified details
        try {
          toast.loading('Creating token metadata...')
          
          // Token metadata details
          const tokenName = '7affle Token'
          const tokenSymbol = '$7F'
          const tokenDescription = 'The official token of 7affle.fun'
          
          // Using the Imgur URL you provided for the token image
          const imageUrl = 'https://i.imgur.com/BrGX4za.png'
          
          // Create metadata URI with all details
          const metadataUri = JSON.stringify({
            name: tokenName,
            symbol: tokenSymbol,
            description: tokenDescription,
            image: imageUrl,
            external_url: 'https://7affle.fun',
            properties: {
              files: [
                {
                  uri: imageUrl,
                  type: 'image/png'
                }
              ],
              category: 'image',
              creators: [],
              links: {
                website: 'https://7affle.fun',
                telegram: 'https://t.me/Raffle_Fun'
              }
            }
          })
          
          // Create token metadata using the utility function
          const metadataTx = await updateTokenMetadata(
            provider,
            { publicKey, signTransaction },
            tokenMint,
            tokenName,
            tokenSymbol,
            metadataUri
          )
          
          console.log('Token metadata created with tx:', metadataTx)
          toast.success('Token metadata created successfully!')
        } catch (metadataError) {
          console.error('Error creating token metadata:', metadataError)
          toast.error(`Failed to create token metadata: ${metadataError instanceof Error ? metadataError.message : 'Unknown error'}`)
        }
        
        // Reload token data
        await loadTokenData()
      } catch (error: any) {
        // If error contains 'already in use', the token is already initialized
        if (error?.message?.includes('already in use')) {
          toast.info('Token is already initialized')
          await loadTokenData()
        } else {
          console.error('Error initializing token:', error)
          toast.error(`Failed to initialize token: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error in initialization process:', error)
      toast.error(`Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Exclude address from fees
  async function excludeFromFees() {
    try {
      setIsLoading(true)
      
      if (!provider || !publicKey || !program) {
        toast.error('Wallet not connected or program not available')
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
      
      // Exclude address from fees
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
      
      // Clear input
      setExcludeAddress('')
      
      // Reload token data to update excluded addresses list
      await loadTokenData()
    } catch (error) {
      console.error('Error excluding address from fees:', error)
      toast.error(`Failed to exclude address: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Mint tokens to an address
  async function mintTokens() {
    try {
      setIsLoading(true)
      
      if (!provider || !publicKey || !tokenMint) {
        toast.error('Wallet not connected or token mint not available')
        return
      }
      
      // Basic input validation
      if (!recipientAddress.trim()) {
        toast.error('Recipient address is required')
        return
      }
      
      if (!mintAmount.trim() || isNaN(Number(mintAmount)) || Number(mintAmount) <= 0) {
        toast.error('Valid mint amount is required')
        return
      }
      
      let recipient: PublicKey
      try {
        recipient = new PublicKey(recipientAddress)
      } catch (error) {
        toast.error('Invalid recipient address')
        return
      }
      
      // Get mint keypair
      const mintKeypair = getMintKeypair()
      if (!mintKeypair) {
        toast.error('Mint keypair not available')
        return
      }
      
      // Calculate amount with decimals
      const amount = Number(mintAmount) * Math.pow(10, tokenDecimals)
      
      // Get or create recipient's token account
      const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        { publicKey, signTransaction } as any, // Use wallet adapter for signing
        tokenMint,
        recipient
      )
      
      console.log(`Minting ${mintAmount} tokens to ${recipient.toString()}...`)
      
      // Mint tokens
      const signature = await mintTo(
        provider.connection,
        { publicKey, signTransaction } as any, // Use wallet adapter for signing
        tokenMint,
        recipientTokenAccount.address,
        publicKey, // Mint authority
        BigInt(amount)
      )
      
      console.log('Tokens minted with tx:', signature)
      toast.success(`${mintAmount} tokens minted to ${ellipsify(recipient.toString())}`)
      
      // Clear inputs
      setRecipientAddress('')
      setMintAmount('')
      
      // Reload token data to update supply
      await loadTokenData()
    } catch (error) {
      console.error('Error minting tokens:', error)
      toast.error(`Failed to mint tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!isAdmin) {
    return (
      <Card className="bg-gray-800/40 border border-gray-700/50">
        <CardHeader>
          <CardTitle>Token Administration</CardTitle>
          <CardDescription>Manage the $7F reflection token</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400">You need administrator privileges to access this panel.</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="bg-gray-800/40 border border-gray-700/50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Coins className="h-5 w-5 mr-2 text-purple-400" />
              $7F Token Administration
            </CardTitle>
            <CardDescription>
              Manage the 7% Reflection Token settings
            </CardDescription>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={loadTokenData} 
            disabled={isLoading}
          >
            <RefreshCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="initialize">Initialize</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            {tokenConfig ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gray-900/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Token Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Mint Address:</span>
                          <span className="text-purple-300 font-mono text-sm">
                            {ellipsify(tokenConfig.mint.toString())}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Treasury:</span>
                          <span className="text-purple-300 font-mono text-sm">
                            {ellipsify(tokenConfig.treasury.toString())}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Supply:</span>
                          <span className="text-white">
                            {(tokenConfig.totalSupply / 1_000_000).toLocaleString()} $7F
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Authority:</span>
                          <span className="text-purple-300 font-mono text-sm">
                            {ellipsify(tokenConfig.authority.toString())}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Fee Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Fees Collected:</span>
                          <span className="text-white">
                            {(tokenConfig.totalFeesCollected / 1_000_000).toLocaleString()} $7F
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Treasury Fees:</span>
                          <span className="text-green-300">
                            {(tokenConfig.treasuryFeesCollected / 1_000_000).toLocaleString()} $7F
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Reflection Fees:</span>
                          <span className="text-purple-300">
                            {(tokenConfig.reflectionFeesCollected / 1_000_000).toLocaleString()} $7F
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fee Structure:</span>
                          <span className="text-white">
                            7% (4% Reflection, 3% Treasury)
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {reflectionTracker && (
                  <Card className="bg-gray-900/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Reflection Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-800/60 p-3 rounded-lg">
                          <p className="text-gray-400 text-sm">Total Reflected</p>
                          <p className="text-xl font-bold text-purple-300">
                            {(reflectionTracker.totalReflected / 1_000_000).toLocaleString()} $7F
                          </p>
                        </div>
                        <div className="bg-gray-800/60 p-3 rounded-lg">
                          <p className="text-gray-400 text-sm">Global Reflection Index</p>
                          <p className="text-xl font-bold text-green-300">
                            {reflectionTracker.globalReflectionIndex.toString()}
                          </p>
                        </div>
                        <div className="bg-gray-800/60 p-3 rounded-lg">
                          <p className="text-gray-400 text-sm">Last Update</p>
                          <p className="text-xl font-bold text-blue-300">
                            {new Date(reflectionTracker.lastUpdateTime * 1000).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {tokenConfig?.excludedFromFee?.length > 0 && (
                  <Card className="bg-gray-900/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md flex items-center">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Fee-Excluded Addresses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {tokenConfig.excludedFromFee.map((address: PublicKey, index: number) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="bg-purple-900/20 text-purple-300 font-mono py-1"
                          >
                            {ellipsify(address.toString())}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Token not initialized or data not loaded.</p>
                <Button onClick={loadTokenData} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Load Token Data'}
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Initialize Tab */}
          <TabsContent value="initialize">
            <Card className="bg-gray-900/60">
              <CardHeader>
                <CardTitle className="text-md flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Initialize $7F Token
                </CardTitle>
                <CardDescription>
                  Set up the token with initial parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="treasuryAddress">Treasury Wallet Address</Label>
                    <Input
                      id="treasuryAddress"
                      placeholder="Treasury public key (e.g., ALo5Qh...)"
                      value={treasuryAddress}
                      onChange={(e) => setTreasuryAddress(e.target.value)}
                      disabled={isLoading || tokenConfig !== null}
                    />
                    <p className="text-xs text-gray-400">
                      The treasury wallet will receive 3% of all transaction fees.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="totalSupply">Total Supply</Label>
                    <Input
                      id="totalSupply"
                      type="number"
                      placeholder="Total token supply (e.g., 7000000)"
                      value={totalSupply}
                      onChange={(e) => setTotalSupply(e.target.value)}
                      disabled={isLoading || tokenConfig !== null}
                    />
                    <p className="text-xs text-gray-400">
                      The total number of tokens that will exist.
                    </p>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      onClick={initializeToken} 
                      disabled={isLoading || !treasuryAddress || !totalSupply || tokenConfig !== null}
                      className="w-full"
                    >
                      {isLoading ? 'Initializing...' : 'Initialize Token'}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <div className="border-t border-gray-800 p-6 pt-4 text-xs text-gray-400">
                <p>
                  Note: The token will be created with 6 decimals and 7% transaction fee (4% reflection, 3% treasury).
                  The treasury wallet will be automatically excluded from fees and rewards.
                </p>
              </div>
            </Card>
          </TabsContent>
          
          {/* Manage Tab */}
          <TabsContent value="manage">
            <div className="space-y-6">
              {/* Fee Exclusion */}
              <Card className="bg-gray-900/60">
                <CardHeader>
                  <CardTitle className="text-md flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Fee Exclusions
                  </CardTitle>
                  <CardDescription>
                    Exclude addresses from the 7% transaction fee
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="excludeAddress">Address to Exclude</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="excludeAddress"
                          placeholder="Public key to exclude from fees"
                          value={excludeAddress}
                          onChange={(e) => setExcludeAddress(e.target.value)}
                          className="bg-gray-800/60 flex-1"
                        />
                        <Button 
                          onClick={excludeFromFees} 
                          disabled={isLoading || !excludeAddress || !tokenConfig}
                        >
                          Exclude
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">
                        Typically used for exchange wallets, DEX pools, or other service wallets.
                      </p>
                    </div>
                    
                    {excludedAddresses.length > 0 && (
                      <div className="pt-2">
                        <Label>Currently Excluded Addresses</Label>
                        <div className="mt-2 flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-gray-800/40 rounded-md">
                          {excludedAddresses.map((address, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="bg-purple-900/20 text-purple-300 font-mono"
                            >
                              {ellipsify(address)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Token Minting */}
              <Card className="bg-gray-900/60">
                <CardHeader>
                  <CardTitle className="text-md flex items-center">
                    <Coins className="h-4 w-4 mr-2" />
                    Mint Tokens
                  </CardTitle>
                  <CardDescription>
                    Mint tokens to any address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient">Recipient Address</Label>
                      <Input
                        id="recipient"
                        placeholder="Recipient public key"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        className="bg-gray-800/60"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount to Mint</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Amount (e.g., 1000)"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(e.target.value)}
                        className="bg-gray-800/60"
                      />
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        onClick={mintTokens} 
                        disabled={isLoading || !mintAmount || !recipientAddress || !tokenConfig}
                        className="w-full"
                      >
                        {isLoading ? 'Minting...' : 'Mint Tokens'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <div className="border-t border-gray-800 p-6 pt-4 text-xs text-gray-400">
                  <p>
                    Note: Only the token authority can mint new tokens. The total supply limit is not enforced by the program,
                    so be careful with minting to avoid devaluing the token.
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

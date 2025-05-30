import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check, Share2, Twitter, Send } from 'lucide-react'

// Type for referral user data
type ReferredUser = {
  address: string;
  date: string;
}

export function ReferralDashboard() {
  const { publicKey } = useWallet()
  const [copied, setCopied] = useState(false)
  
  // State for entering someone else's referral code
  const [referralInputCode, setReferralInputCode] = useState('')
  const [referralCodeError, setReferralCodeError] = useState('')
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false)
  const [referralSuccess, setReferralSuccess] = useState(false)
  
  // Generate referral link based on user's wallet address and current location
  const walletAddress = publicKey?.toBase58() || ''
  
  // Use only the last 6 characters of wallet address for privacy
  const shortWalletId = walletAddress ? walletAddress.slice(-6) : ''
  
  // The referral code is simply the last 6 characters of the wallet address
  const referralCode = shortWalletId
  
  // Store the mapping between short ID and full wallet address
  useEffect(() => {
    if (walletAddress && shortWalletId) {
      try {
        // Get existing mappings or initialize new object
        const refMappings = JSON.parse(localStorage.getItem('referralMappings') || '{}')
        
        // Add this wallet's mapping
        refMappings[shortWalletId] = walletAddress
        
        // Save back to localStorage
        localStorage.setItem('referralMappings', JSON.stringify(refMappings))
        
        console.log(`Stored referral mapping: ${shortWalletId} -> ${walletAddress}`)
      } catch (error) {
        console.error('Error storing referral mapping:', error)
      }
    }
  }, [walletAddress, shortWalletId])
  
  // Handle copy to clipboard
  const copyToClipboard = () => {
    // Just copy the 6-digit code now
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // Validate and resolve a referral code to a full wallet address
  const validateReferralCode = async () => {
    if (!referralInputCode || referralInputCode.length !== 6) {
      setReferralCodeError('Please enter a valid 6-digit referral code')
      return null
    }
    
    // Make sure they're not entering their own code
    if (referralInputCode === shortWalletId) {
      setReferralCodeError("You can't use your own referral code")
      return null
    }
    
    try {
      // Get referral mappings from localStorage
      const refMappings = JSON.parse(localStorage.getItem('referralMappings') || '{}')
      
      // Try to find the full wallet address for this code
      const referrerWalletAddress = refMappings[referralInputCode]
      
      if (!referrerWalletAddress) {
        setReferralCodeError('Referral code not found. Please check and try again.')
        return null
      }
      
      // Check if they've already set a referrer
      const userReferrals = JSON.parse(localStorage.getItem('userReferrals') || '{}')
      if (userReferrals[walletAddress]) {
        setReferralCodeError("You've already set a referrer")
        return null
      }
      
      return referrerWalletAddress
    } catch (error) {
      console.error('Error validating referral code:', error)
      setReferralCodeError('Error validating referral code. Please try again.')
      return null
    }
  }
  
  // Submit the referral relationship
  const submitReferralCode = async () => {
    if (!publicKey || !referralInputCode) return
    
    try {
      setIsSubmittingReferral(true)
      setReferralCodeError('')
      
      // Validate the referral code
      const referrerWalletAddress = await validateReferralCode()
      if (!referrerWalletAddress) {
        setIsSubmittingReferral(false)
        return
      }
      
      // In a real implementation, this would be a blockchain transaction
      // that records the referral relationship on-chain
      console.log(`Setting referral relationship: ${walletAddress} was referred by ${referrerWalletAddress}`)
      
      // For testing, store the relationship in localStorage
      const userReferrals = JSON.parse(localStorage.getItem('userReferrals') || '{}')
      userReferrals[walletAddress] = referrerWalletAddress
      localStorage.setItem('userReferrals', JSON.stringify(userReferrals))
      
      // Also update the referrer's stats for the UI
      const referrerKey = `referrals_${referrerWalletAddress}`
      let referrerData = JSON.parse(localStorage.getItem(referrerKey) || '{"referredUsers":[]}')
      
      // Add this user to the referrer's list
      referrerData.referredUsers.push({
        address: walletAddress,
        date: new Date().toISOString()
      })
      
      localStorage.setItem(referrerKey, JSON.stringify(referrerData))
      
      // Show success state
      setReferralSuccess(true)
      setReferralInputCode('')
      
      // Reset after a few seconds
      setTimeout(() => {
        setReferralSuccess(false)
        // Reload referral data
        loadReferralData()
      }, 3000)
      
    } catch (error) {
      console.error('Error submitting referral code:', error)
      setReferralCodeError('Failed to submit referral. Please try again.')
    } finally {
      setIsSubmittingReferral(false)
    }
  }
  
  // Get referral data from localStorage
  const [referralStats, setReferralStats] = useState({
    totalReferred: 0,
    pendingRewards: 0.0,
    claimedRewards: 0.0,
    referredUsers: []
  });
  
  // Calculate pending rewards based on number of referrals
  // In a real implementation, this would be calculated based on actual ticket purchases
  const calculateRewards = (referredUsers: ReferredUser[]) => {
    // For testing, we'll just give 0.1 SOL per referral
    return referredUsers.length * 0.1;
  };
  
  // Function to load referral data
  const loadReferralData = () => {
    try {
      // Check if there are any referrals in localStorage
      const myAddress = publicKey?.toBase58();
      if (!myAddress) return;
      
      // For testing: create a referral tracking system in localStorage
      const referralKey = `referrals_${myAddress}`;
      
      // Get existing referrals data or initialize if not present
      let referralsData = JSON.parse(localStorage.getItem(referralKey) || '{"referredUsers": []}');
      
      // Check if anyone has stored this wallet as their referrer
      // This is just for testing - in production this would be tracked by the smart contract
      const allLocalStorage = { ...localStorage };
      const referredUsers: ReferredUser[] = [];
      
      // Check userReferrals object for direct referrals
      const userReferrals = JSON.parse(localStorage.getItem('userReferrals') || '{}');
      
      Object.entries(userReferrals).forEach(([userWallet, referrerWallet]) => {
        if (referrerWallet === myAddress) {
          // This user has set the current wallet as their referrer
          const referredUser: ReferredUser = { 
            address: userWallet, 
            date: new Date().toISOString() 
          };
          referredUsers.push(referredUser);
        }
      });
      
      // Also check the old method for backward compatibility
      Object.keys(allLocalStorage).forEach(key => {
        if (key === 'referrer' && allLocalStorage[key] === myAddress) {
          // This is a direct referral from the current browser
          const mockUser: ReferredUser = { 
            address: 'Current Browser User', 
            date: new Date().toISOString() 
          };
          referredUsers.push(mockUser);
        }
      });
      
      // Update the referral data with any new users
      if (referredUsers.length > 0) {
        // Filter out duplicates
        const existingAddresses = new Set(referralsData.referredUsers.map((u: ReferredUser) => u.address));
        const newReferrals = referredUsers.filter(u => !existingAddresses.has(u.address));
        
        if (newReferrals.length > 0) {
          referralsData.referredUsers = [...(referralsData.referredUsers || []), ...newReferrals];
          localStorage.setItem(referralKey, JSON.stringify(referralsData));
        }
      }
      
      // Update the stats
      setReferralStats({
        totalReferred: referralsData.referredUsers?.length || 0,
        pendingRewards: calculateRewards(referralsData.referredUsers || []),
        claimedRewards: 0, // In a real implementation, this would be tracked
        referredUsers: referralsData.referredUsers || []
      });
    } catch (error) {
      console.error('Error loading referral data:', error);
    }
  };
  
  // Update referral stats when component mounts
  useEffect(() => {
    // In a real implementation, this would come from your smart contract
    // For testing, we'll just get the data from localStorage
    loadReferralData();
    // Set up interval to periodically check for new referrals
    const intervalId = setInterval(loadReferralData, 5000);
    
    return () => clearInterval(intervalId);
  }, [publicKey, loadReferralData])
  
  return (
    <div className="space-y-6">
      {/* Referral Link Generator */}
      <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center mb-2">
            <svg className="w-6 h-6 text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h2 className="text-xl font-bold text-white">Your Referral Code</h2>
          </div>
          
          <p className="text-gray-300">
            Share this code with friends and earn 1% of their ticket purchases!
          </p>
          
          <div className="flex mt-4">
            <Input
              className="w-full py-2 px-3 bg-black/30 text-white border border-purple-700/50 rounded-lg text-center font-bold text-lg tracking-wider"
              value={referralCode}
              readOnly
            />
            <Button
              onClick={copyToClipboard}
              className="ml-2 bg-purple-700 hover:bg-purple-600 text-white"
            >
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" className="bg-transparent border-purple-500/30 text-purple-300 hover:bg-purple-900/20">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" className="bg-transparent border-blue-500/30 text-blue-300 hover:bg-blue-900/20">
              <Twitter className="h-4 w-4 mr-2" />
              Tweet
            </Button>
            <Button variant="outline" className="bg-transparent border-green-500/30 text-green-300 hover:bg-green-900/20">
              <Send className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Enter Referral Code Section */}
      <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Enter a Referral Code</h3>
        <p className="text-gray-300 text-sm mb-4">
          Have a friend's referral code? Enter it here to connect with them and help them earn rewards when you purchase tickets.
        </p>
        
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter 6-digit referral code"
              value={referralInputCode}
              onChange={(e) => {
                setReferralInputCode(e.target.value.trim());
                if (referralCodeError) setReferralCodeError('');
              }}
              maxLength={6}
              className="bg-black/30 border-purple-500/30 text-white text-center"
              disabled={isSubmittingReferral || referralSuccess}
            />
          </div>
          
          {referralCodeError && (
            <p className="text-red-400 text-sm text-center">{referralCodeError}</p>
          )}
          
          {referralSuccess && (
            <p className="text-green-400 text-sm text-center">
              Referral connection successful! You've been connected to this referrer.
            </p>
          )}
          
          <div className="flex justify-center">
            <Button
              onClick={submitReferralCode}
              disabled={!referralInputCode || isSubmittingReferral || referralSuccess}
              className="bg-purple-700 hover:bg-purple-600 text-white"
            >
              {isSubmittingReferral ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>Submit Referral Code</>
              )}
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Users Referred" 
          value={referralStats.totalReferred}
          icon={
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard 
          title="Pending Rewards" 
          value={`${referralStats.pendingRewards.toFixed(2)} SOL`}
          icon={
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard 
          title="Total Earned" 
          value={`${referralStats.claimedRewards.toFixed(2)} SOL`}
          icon={
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
      
      {/* How It Works */}
      <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How Referrals Work</h3>
        <div className="space-y-4">
          <Step
            number={1}
            title="Share Your Link"
            description="Send your unique referral link to friends and on social media"
          />
          <Step
            number={2}
            title="Friends Join & Play"
            description="When they connect their wallet through your link, they're registered as your referral"
          />
          <Step
            number={3}
            title="Earn Rewards"
            description="Receive 1% of every ticket purchase made by your referrals"
          />
          <Step
            number={4}
            title="Withdraw Anytime"
            description="Claim your rewards to your wallet whenever you want"
          />
        </div>
      </Card>
      
      {/* Referred Users (placeholder) */}
      <Card className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Your Referred Users</h3>
        {referralStats.referredUsers.length > 0 ? (
          <div className="space-y-3">
            {/* User list would go here */}
            <p>User list will appear here</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="h-8 w-8 text-purple-400" />
            </div>
            <h4 className="text-white font-medium mb-2">No Referrals Yet</h4>
            <p className="text-gray-400 text-sm mb-4">
              Share your referral code to start earning rewards!
            </p>
            <Button 
              onClick={copyToClipboard}
              className="bg-purple-700 hover:bg-purple-600 text-white"
            >
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              Copy Referral Code
            </Button>
          </div>
        )}
      </Card>      
      {/* Claim Rewards Button (disabled when no rewards) */}
      <div className="text-center">
        <Button 
          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-8 py-6 text-lg font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={referralStats.pendingRewards <= 0}
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Claim {referralStats.pendingRewards.toFixed(2)} SOL Rewards
        </Button>
      </div>
    </div>
  )
}

// Helper Components
function StatCard({ title, value, icon }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <div className="mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

function Step({ number, title, description }: { 
  number: number; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex">
      <div className="flex-shrink-0 mr-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-700 text-white font-bold">
          {number}
        </div>
      </div>
      <div>
        <h4 className="text-white font-medium">{title}</h4>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  )
}

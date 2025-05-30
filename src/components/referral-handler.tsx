import { useEffect } from 'react';

/**
 * Component to handle referral links
 * It checks for a "ref" parameter in the URL and stores it in localStorage
 */
export function ReferralHandler() {
  useEffect(() => {
    // Function to process referrals
    const processReferral = () => {
      try {
        // Get the URL search parameters
        const urlParams = new URLSearchParams(window.location.search);
        const shortRefId = urlParams.get('ref');
        
        // If there's a referrer ID in the URL
        if (shortRefId) {
          console.log(`Short referral ID detected: ${shortRefId}`);
          
          // Look up the full wallet address from our mapping
          try {
            const refMappings = JSON.parse(localStorage.getItem('referralMappings') || '{}');
            const fullWalletAddress = refMappings[shortRefId];
            
            if (fullWalletAddress) {
              // We found the full wallet address from the short ID
              console.log(`Resolved to full wallet: ${fullWalletAddress}`);
              localStorage.setItem('referrer', fullWalletAddress);
            } else {
              // If we can't find a mapping, just store the short ID
              // This might be a valid address if it's only 6 characters long
              console.log(`Could not resolve to full wallet, using as-is`);
              localStorage.setItem('referrer', shortRefId);
            }
          } catch (error) {
            console.error('Error resolving referral mapping:', error);
            // Store the short ID anyway as fallback
            localStorage.setItem('referrer', shortRefId);
          }
          
          // Optional: Remove the ref parameter from URL to clean it up
          if (window.history && window.history.replaceState) {
            // Remove ref from URL params
            urlParams.delete('ref');
            const newUrl = window.location.pathname + 
              (urlParams.toString() ? '?' + urlParams.toString() : '') +
              window.location.hash;
              
            window.history.replaceState({}, document.title, newUrl);
          }
        }
      } catch (error) {
        console.error('Error processing referral:', error);
      }
    };

    // Process the referral when the component mounts
    processReferral();
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * Helper function to get the current user's referrer (if any)
 * Use this when making purchases to attribute the referral
 */
export function getReferrer(): string | null {
  return localStorage.getItem('referrer');
}

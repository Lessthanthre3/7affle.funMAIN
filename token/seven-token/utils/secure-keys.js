/**
 * SECURE KEYPAIR MANAGEMENT
 * 
 * This file contains utilities for securely loading keypair data.
 * In a production environment, this would be replaced with proper key management,
 * such as environment variables, HSMs, or secure vaults.
 */

const fs = require('fs');
const path = require('path');

/**
 * Get the mint keypair bytes in a more secure way than hardcoding in source
 * For development purposes only - Not suitable for production use
 * @returns {number[] | null} The keypair bytes or null if not available
 */
function getMintKeypairBytes() {
  try {
    // Try to load from keypair file
    const keypairPath = path.resolve(__dirname, '../keypair/CA.json');
    if (fs.existsSync(keypairPath)) {
      const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
      return keypairData;
    }
    
    // If file loading fails, could fall back to environment variables
    // For example: process.env.MINT_KEYPAIR_DATA
    
    console.warn('No keypair file found at:', keypairPath);
    return null;
  } catch (error) {
    console.error('Error loading keypair:', error);
    return null;
  }
}

module.exports = {
  getMintKeypairBytes
};

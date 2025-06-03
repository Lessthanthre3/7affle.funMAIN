/**
 * Local token setup script
 * This script helps initialize the $7F token locally for testing
 */

import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount,
  mintTo
} from '@solana/spl-token';
import { ENV } from '../lib/environment';
import fs from 'fs';
import path from 'path';

// Initialize connection to local validator
const connection = new Connection(ENV.isLocal ? 'http://localhost:8899' : clusterApiUrl('devnet'), 'confirmed');

// Load or create payer keypair for local testing
const getOrCreateKeypair = () => {
  const localKeypairPath = path.resolve('local-keypair.json');
  
  try {
    if (fs.existsSync(localKeypairPath)) {
      const keypairData = fs.readFileSync(localKeypairPath, 'utf-8');
      const secretKey = Uint8Array.from(JSON.parse(keypairData));
      return Keypair.fromSecretKey(secretKey);
    }
  } catch (err) {
    console.log('Error loading keypair:', err);
  }
  
  // Create new keypair if none exists
  const newKeypair = Keypair.generate();
  fs.writeFileSync(localKeypairPath, JSON.stringify(Array.from(newKeypair.secretKey)));
  return newKeypair;
};

// Main setup function
const setupLocalToken = async () => {
  console.log('Setting up local $7F token...');
  
  try {
    // Get or create local keypair
    const payer = getOrCreateKeypair();
    console.log('Using keypair:', payer.publicKey.toString());
    
    // Request airdrop for the payer if needed
    const balance = await connection.getBalance(payer.publicKey);
    if (balance < LAMPORTS_PER_SOL) {
      console.log('Requesting airdrop...');
      const signature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('Airdrop received');
    }
    
    // Create mint account
    console.log('Creating mint...');
    const mintAuthority = payer;
    const freezeAuthority = payer;
    const decimals = ENV.tokenDecimals;
    
    const tokenMint = await createMint(
      connection,
      payer,
      mintAuthority.publicKey,
      freezeAuthority.publicKey,
      decimals
    );
    console.log('Token mint created:', tokenMint.toString());
    
    // Create token account for payer
    console.log('Creating token account...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      tokenMint,
      payer.publicKey
    );
    console.log('Token account created:', tokenAccount.address.toString());
    
    // Mint initial supply to payer
    console.log('Minting tokens...');
    const initialSupply = 1_000_000_000 * (10 ** decimals); // 1 billion tokens
    await mintTo(
      connection,
      payer,
      tokenMint,
      tokenAccount.address,
      mintAuthority,
      initialSupply
    );
    console.log(`Minted ${initialSupply / (10 ** decimals)} tokens to ${payer.publicKey.toString()}`);
    
    // Save token information to a file for reference
    const tokenInfo = {
      tokenMint: tokenMint.toString(),
      payerPublicKey: payer.publicKey.toString(),
      tokenAccount: tokenAccount.address.toString(),
      environment: ENV.name,
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.resolve('local-token-info.json'),
      JSON.stringify(tokenInfo, null, 2)
    );
    console.log('Token information saved to local-token-info.json');
    
    console.log('Local token setup complete!');
    return tokenInfo;
  } catch (error) {
    console.error('Error setting up local token:', error);
    throw error;
  }
};

// Run the setup if executed directly
if (require.main === module) {
  setupLocalToken()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to set up local token:', error);
      process.exit(1);
    });
}

export { setupLocalToken };

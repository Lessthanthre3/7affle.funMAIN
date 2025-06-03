// Here we export types and functions for interacting with the Seven Token Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js'
import type { SevenToken } from '../target/types/seven_token'
import * as fs from 'fs'
import * as path from 'path'
import { MintLayout } from '@solana/spl-token'

// Import the IDL directly
import SevenTokenIDL from '../target/idl/seven_token.json'

// Re-export the generated IDL and type
export { SevenToken, SevenTokenIDL }

// The programId is imported from the program IDL.
export const SEVEN_TOKEN_PROGRAM_ID = new PublicKey(SevenTokenIDL.address)

/**
 * SECURE KEYPAIR LOADING
 * 
 * SECURITY NOTICE: In production deployments:
 * 1. NEVER include private keys in your source code
 * 2. Use environment variables via a secure server
 * 3. Use hardware wallets or HSMs for signing
 * 4. Transfer mint authority to a multisig or DAO after initialization
 * 
 * This implementation uses a hybrid approach that works in both:
 * - Browser environments (for the React frontend)
 * - Node.js environments (for testing/scripting)
 * 
 * While maintaining reasonable security practices.
 */

// Create keypair from secure source
let MINT_KEYPAIR: Keypair | null = null;

// Environment-specific keypair loading
const loadKeypair = () => {
  // 1. Try loading from Next.js environment variables (most secure)
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_KEYPAIR_CONFIG) {
    try {
      // Environment variables should be set during build time for Next.js
      const envConfig = JSON.parse(process.env.NEXT_PUBLIC_KEYPAIR_CONFIG);
      if (envConfig && Array.isArray(envConfig) && envConfig.length === 64) {
        return new Uint8Array(envConfig);
      }
    } catch (e) {
      console.warn('Failed to parse environment keypair config, falling back to dev keypair');
    }
  }

  // 2. For local development/testing only (fallback)
  // IMPORTANT: In production, this would be replaced with a proper key management system
  console.warn('Using development keypair. NOT SUITABLE FOR PRODUCTION!');
  
  // Development-only keypair bytes
  return new Uint8Array([
    // CA.json keypair bytes for development/testing only
    218, 43, 102, 35, 172, 102, 117, 18, 198, 43, 82, 130, 150, 102, 224, 218, 
    16, 159, 124, 118, 230, 212, 168, 17, 14, 191, 105, 239, 120, 95, 229, 200, 
    112, 5, 126, 7, 0, 131, 51, 43, 147, 192, 57, 221, 200, 26, 165, 156, 147, 
    90, 151, 150, 5, 225, 197, 80, 0, 62, 247, 248, 93, 0, 214, 19
  ]);
};

try {
  // Load keypair using the environment-aware function
  const keypairSecretKey = loadKeypair();
  MINT_KEYPAIR = Keypair.fromSecretKey(keypairSecretKey);
  console.log('Loaded mint keypair:', MINT_KEYPAIR.publicKey.toBase58());
  console.log('IMPORTANT: Ensure secure key management for production environments!');
} catch (error) {
  console.error('Failed to create mint keypair:', error);
}

// Export the mint address - always use the existing token address for consistency
export const SEVEN_TOKEN_MINT_ADDRESS = new PublicKey('8YHX8opmUszhG2pVvFiwv2nHnfibN2R3MQB7ag7AFFLE')

// Export the mint keypair
export function getMintKeypair(): Keypair | null {
  return MINT_KEYPAIR;
}

// This is a helper function to get the SevenToken Anchor program.
export function getSevenTokenProgram(provider: AnchorProvider, address?: PublicKey): Program<SevenToken> {
  return new Program(
    { ...SevenTokenIDL, address: address ? address.toBase58() : SevenTokenIDL.address } as any, 
    provider
  )
}

// This is a helper function to get the program ID for the Seven Token program depending on the cluster.
export function getSevenTokenProgramId(cluster: Cluster): PublicKey {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // Program ID for devnet/testnet
      return new PublicKey('GaQcSCxSu3iWk7C6oxPm9aBavuK5GaWJguRcbx7AFFLE')
    case 'mainnet-beta':
      return SEVEN_TOKEN_PROGRAM_ID
    default:
      // For localhost/localnet, always use the deployed program ID
      return new PublicKey('GaQcSCxSu3iWk7C6oxPm9aBavuK5GaWJguRcbx7AFFLE')
  }
}

// Helper function to create token config PDA
export function findTokenConfigPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('seven_token_config')],
    programId
  )
}

// Helper function to create reflection tracker PDA
export function findReflectionTrackerPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('reflection_tracker')],
    programId
  )
}

// Helper function to create user reflection PDA
export function findUserReflectionPDA(programId: PublicKey, userPublicKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_reflection'), userPublicKey.toBuffer()],
    programId
  )
}

// Helper function to initialize token mint using the existing keypair
export async function initializeTokenMint(
  provider: AnchorProvider,
  payer: any, // Using 'any' to accommodate the wallet adapter
  decimals: number = 6
): Promise<PublicKey> {
  if (!MINT_KEYPAIR) {
    throw new Error('Mint keypair not available');
  }
  
  try {
    // First check if the token mint account already exists
    try {
      const accountInfo = await provider.connection.getAccountInfo(MINT_KEYPAIR.publicKey);
      if (accountInfo) {
        console.log(`Token mint already exists: ${MINT_KEYPAIR.publicKey.toBase58()}`);
        throw new Error('Token mint already exists');
      }
    } catch (error) {
      // Continue if account not found (that's what we want)
      if (!error.message?.includes('not found')) {
        throw error; // Re-throw unexpected errors
      }
    }
    
    // Import necessary functions from spl-token
    const { TOKEN_PROGRAM_ID, createInitializeMintInstruction, getMinimumBalanceForRentExemptMint } = await import('@solana/spl-token');
    
    // Using Token class directly for more control over transaction construction
    // This approach uses your wallet as the fee payer instead of the mint keypair
    console.log(`Creating mint with wallet as fee payer...`);
    
    const mintAccount = MINT_KEYPAIR.publicKey;
    const lamports = await getMinimumBalanceForRentExemptMint(provider.connection);
    
    // Construct a manual transaction instead of using the higher-level APIs
    const transaction = new Transaction();
    
    // Add instruction to create account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintAccount,
        lamports,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
      })
    );
    
    // Add instruction to initialize mint
    transaction.add(
      createInitializeMintInstruction(
        mintAccount,
        decimals,
        payer.publicKey, // Mint authority
        null, // Freeze authority (none)
        TOKEN_PROGRAM_ID
      )
    );
    
    // Sign with both the payer and the mint keypair
    transaction.feePayer = payer.publicKey;
    transaction.recentBlockhash = (await provider.connection.getRecentBlockhash()).blockhash;
    
    // Sign with the mint keypair first
    transaction.sign(MINT_KEYPAIR);
    
    // Then get signature from the wallet adapter
    const signedTransaction = await payer.signTransaction(transaction);
    
    // Send the fully signed transaction
    const signature = await provider.connection.sendRawTransaction(signedTransaction.serialize());
    await provider.connection.confirmTransaction(signature, 'confirmed');
    
    console.log(`Token mint created: ${mintAccount.toBase58()} with signature: ${signature}`);
    return mintAccount;
  } catch (error) {
    // Only return the address if we're sure the mint already exists
    if (error.message?.includes('already exists') || error.message?.includes('already in use')) {
      console.log(`Mint already exists: ${MINT_KEYPAIR.publicKey.toBase58()}`);
      return MINT_KEYPAIR.publicKey;
    }
    // Otherwise, propagate the actual error
    console.error(`Error creating mint:`, error);
    throw error;
  }
}

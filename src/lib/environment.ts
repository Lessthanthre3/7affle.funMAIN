/**
 * Environment configuration for 7affle token development
 * This provides consistent access to environment variables across different deployment stages
 */

// Environment type definition
type Environment = 'local' | 'devnet' | 'mainnet';

// No default needed as we set it in ENVIRONMENT

// Import the token mint address from token exports
import { SEVEN_TOKEN_MINT_ADDRESS } from '../../token/seven-token/utils/token-exports';

// Determine the current environment
const ENVIRONMENT: Environment = 
  (process?.env?.REACT_APP_ENVIRONMENT as Environment) || 
  (import.meta?.env?.VITE_ENVIRONMENT as Environment) || 
  'local'; // Default to local if not specified

// RPC endpoints for different environments
const RPC_ENDPOINTS = {
  local: 'http://localhost:8899',
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
};

// Program IDs
const TOKEN_PROGRAM_IDS = {
  local: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Same across all environments
  devnet: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  mainnet: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
};

// Token Mint Addresses - use the imported SEVEN_TOKEN_MINT_ADDRESS for consistency
const TOKEN_MINT_ADDRESSES = {
  local: SEVEN_TOKEN_MINT_ADDRESS.toString(),
  devnet: SEVEN_TOKEN_MINT_ADDRESS.toString(),
  mainnet: SEVEN_TOKEN_MINT_ADDRESS.toString(),
};

// Wallet addresses
const TREASURY_WALLET_ADDRESSES = {
  local: 'GhSwQL8opHBhE8PNog9ZGbuzTVdhPMEr5JJTHZQ9GRHq',
  devnet: 'ALo5Qhjy46wVCXnD4osQXTq6ufF5MZ9uhxARAy7affLe',
  mainnet: 'ALo5Qhjy46wVCXnD4osQXTq6ufF5MZ9uhxARAy7affLe',
};

const RAFFLE_PROGRAM_IDS = {
  local: 'GUXx1x2kMBxJwLmyxWJMaWAqMhJHx7zabDqHdv7AFFLE', // From your Anchor.toml
  devnet: 'GUXx1x2kMBxJwLmyxWJMaWAqMhJHx7zabDqHdv7AFFLE',
  mainnet: 'GUXx1x2kMBxJwLmyxWJMaWAqMhJHx7zabDqHdv7AFFLE',
};

export const ENV = {
  name: ENVIRONMENT,
  isLocal: ENVIRONMENT === 'local',
  isDevnet: ENVIRONMENT === 'devnet',
  isMainnet: ENVIRONMENT === 'mainnet',
  rpcEndpoint: RPC_ENDPOINTS[ENVIRONMENT],
  tokenProgramId: TOKEN_PROGRAM_IDS[ENVIRONMENT],
  raffleProgramId: RAFFLE_PROGRAM_IDS[ENVIRONMENT],
  tokenMintAddress: TOKEN_MINT_ADDRESSES[ENVIRONMENT],
  treasuryWalletAddress: TREASURY_WALLET_ADDRESSES[ENVIRONMENT],
  tokenName: '$7F Token',
  tokenSymbol: '$7F',
  tokenDecimals: 6,
};

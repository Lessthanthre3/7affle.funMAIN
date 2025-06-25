/**
 * Environment configuration for 7affle development
 * This provides consistent access to environment variables across different deployment stages
 */

// Environment type definition
type Environment = 'local' | 'devnet' | 'mainnet';

// No default needed as we set it in ENVIRONMENT

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

// No token program IDs needed anymore as we've removed the token functionality

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
  rpcEndpoint: process.env.REACT_APP_SOLANA_RPC || RPC_ENDPOINTS[ENVIRONMENT],
  raffleProgramId: RAFFLE_PROGRAM_IDS[ENVIRONMENT],
  treasuryWalletAddress: TREASURY_WALLET_ADDRESSES[ENVIRONMENT],
};

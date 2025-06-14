import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, Idl } from '@coral-xyz/anchor';
import dotenv from 'dotenv';
import logger from './logger';
import { IDL } from '../idl/raffle_idl';

dotenv.config();

// Get Solana configuration from environment variables
const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const programId = process.env.RAFFLE_PROGRAM_ID;
const network = process.env.SOLANA_NETWORK || 'devnet';

if (!programId) {
  throw new Error('RAFFLE_PROGRAM_ID is required in .env file');
}

// Create a wallet from a new keypair (read-only wallet for monitoring)
const payer = Keypair.generate();
const wallet = new anchor.Wallet(payer);

/**
 * Get a Solana connection instance
 */
export const getConnection = (): Connection => {
  logger.info(`Connecting to Solana ${network} at ${rpcUrl}`);
  return new Connection(rpcUrl, 'confirmed');
};

/**
 * Get Anchor provider for program interaction
 */
export const getProvider = (): anchor.AnchorProvider => {
  const connection = getConnection();
  return new anchor.AnchorProvider(connection, wallet, {
    preflightCommitment: 'confirmed',
  });
};

/**
 * Get the raffle program instance
 */
export const getRaffleProgram = (): Program<any> => {
  const provider = getProvider();
  anchor.setProvider(provider);
  // Using 'any' type to bypass strict IDL typing issues
  return new Program(IDL as Idl, new PublicKey(programId), provider);
};

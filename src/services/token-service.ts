import { 
  Connection, 
  PublicKey, 
  Transaction
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  getMint,
  getAccount,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import { 
  BN, 
  AnchorProvider
} from '@coral-xyz/anchor';
import { SEVEN_TOKEN_MINT_ADDRESS } from '../../token/seven-token/utils/token-exports';
import { ENV } from '../lib/environment';

// Removed getProgram function as it's not needed for simplified token functionality

// Constants
export const TOKEN_DECIMALS = 9; // Updated to match the token's actual decimals

export interface TokenHolderData {
  address: string;
  balance: string;
  balanceFormatted: string;
}

export interface TokenStats {
  totalSupply: string;
  totalSupplyFormatted: string;
  circulatingSupply: string;
  circulatingSupplyFormatted: string;
  holders: number;
}

// Market data will be provided by Dexscreener when token is live

export interface TransactionData {
  type: string;
  amount: string;
  date: string;
  txHash: string;
}

// Format large numbers with commas
export function formatWithCommas(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format token amounts based on decimals
export function formatTokenAmount(amount: string, decimals: number = TOKEN_DECIMALS): string {
  if (!amount) return '0';
  
  const actualAmount = new BN(amount).div(new BN(10).pow(new BN(decimals))).toString();
  return formatWithCommas(actualAmount);
}

// Fetch token data for a wallet address
export async function fetchTokenData(connection: Connection, walletAddress: PublicKey | null): Promise<{
  userBalance: string;
  userBalanceFormatted: string;
  tokenDecimals: number;
}> {
  if (!walletAddress) {
    return {
      userBalance: '0',
      userBalanceFormatted: '0',
      tokenDecimals: TOKEN_DECIMALS,
    };
  }

  try {
    const mintInfo = await getMint(connection, SEVEN_TOKEN_MINT_ADDRESS);
    const tokenDecimals = mintInfo.decimals;
    
    // Get the associated token account for this wallet
    const associatedTokenAddress = await getAssociatedTokenAddress(
      SEVEN_TOKEN_MINT_ADDRESS,
      walletAddress,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    try {
      const tokenAccount = await getAccount(connection, associatedTokenAddress);
      const userBalance = tokenAccount.amount.toString();
      const userBalanceFormatted = formatTokenAmount(userBalance, tokenDecimals);
      
      return {
        userBalance,
        userBalanceFormatted,
        tokenDecimals,
      };
    } catch (e) {
      // Token account doesn't exist yet, which means balance is 0
      return {
        userBalance: '0',
        userBalanceFormatted: '0',
        tokenDecimals,
      };
    }
  } catch (error) {
    console.error('Error fetching token data:', error);
    return {
      userBalance: '0',
      userBalanceFormatted: '0',
      tokenDecimals: TOKEN_DECIMALS,
    };
  }
}

// No reflection data needed for simplified token

// Fetch token statistics
export async function fetchTokenStats(connection: Connection): Promise<TokenStats> {
  try {
    console.log('Fetching real token statistics from blockchain...');
    
    // Get the mint info for our token to get total supply
    const mintInfo = await getMint(connection, SEVEN_TOKEN_MINT_ADDRESS);
    const totalSupply = mintInfo.supply.toString();
    const totalSupplyFormatted = formatTokenAmount(totalSupply);
    
    // Get all token accounts for this mint to determine circulating supply and holder count
    const tokenAccountsFilter = {
      programId: TOKEN_PROGRAM_ID,
      filters: [
        {
          dataSize: 165, // Size of token account data
        },
        {
          memcmp: {
            offset: 0, // Mint address offset
            bytes: SEVEN_TOKEN_MINT_ADDRESS.toBase58(),
          },
        },
      ],
    };
    
    // Fetch accounts that hold our token
    const tokenAccounts = await connection.getProgramAccounts(
      TOKEN_PROGRAM_ID,
      { filters: tokenAccountsFilter.filters }
    );
    
    // Count unique holders
    const holders = tokenAccounts.length;
    console.log(`Found ${holders} token holders`);
    
    // Calculate circulating supply (remove any known treasury/locked tokens)
    // For now, we'll assume all tokens are circulating
    const circulatingSupply = totalSupply;
    const circulatingSupplyFormatted = formatTokenAmount(circulatingSupply);
    
    // No reflection calculation needed with simplified token
    
    console.log('Token stats fetched successfully:', {
      totalSupplyFormatted,
      circulatingSupplyFormatted,
      holders
    });
    
    return {
      totalSupply,
      totalSupplyFormatted,
      circulatingSupply,
      circulatingSupplyFormatted,
      holders,
    };
  } catch (error) {
    console.error('Error fetching token stats:', error);
    return {
      totalSupply: '0',
      totalSupplyFormatted: '0',
      circulatingSupply: '0',
      circulatingSupplyFormatted: '0',
      holders: 0,
    };
  }
}

// Market data fetching removed - will be handled by Dexscreener when token is live

// Fetch transaction history data from blockchain
export async function generateTransactionHistory(): Promise<TransactionData[]> {
  try {
    // Connect to the Solana network
    const connection = new Connection(ENV.rpcEndpoint);
    
    // In a real implementation, we would query recent token transactions using getProgramAccounts
    // For example, we could do something like this (commented out as placeholder for future implementation):
    // const tokenAccountsFilter = {
    //   programId: TOKEN_PROGRAM_ID,
    const slot = await connection.getSlot();
    console.log(`Current blockchain slot: ${slot}`);
    
    // First, we need to find all the accounts that hold our token
    const tokenAccounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
      filters: [
        {
          dataSize: 165, // Size of token account data
        },
        {
          memcmp: {
            offset: 0, // Mint address offset
            bytes: SEVEN_TOKEN_MINT_ADDRESS.toBase58(),
          },
        },
      ],
    });
    
    console.log(`Found ${tokenAccounts.length} token accounts for this mint`);
    
    // Now get the real transaction signatures for the token mint
    // Using getSignaturesForAddress to get the latest transactions involving our token mint
    const signatures = await connection.getSignaturesForAddress(
      SEVEN_TOKEN_MINT_ADDRESS,
      { limit: 10 } // Limit to the most recent 10 transactions
    );
    
    console.log(`Found ${signatures.length} transactions for the token mint`);
    
    // If we don't have any signatures, return an empty array
    if (signatures.length === 0) {
      console.log('No transactions found for this token');
      return [];
    }
    
    // Get the transaction details for each signature
    const transactions: TransactionData[] = [];
    
    // Process transactions in parallel with a reasonable batch size
    const batchSize = 3; // Process 3 transactions at a time to avoid rate limits
    
    for (let i = 0; i < signatures.length; i += batchSize) {
      const batch = signatures.slice(i, i + batchSize);
      
      // Process this batch in parallel
      const batchPromises = batch.map(async (sig) => {
        try {
          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });
          
          if (!tx || !tx.blockTime) {
            console.log(`Transaction not found or invalid for signature: ${sig.signature}`);
            return null;
          }
          
          // Extract transaction details
          const txDate = new Date(tx.blockTime * 1000);
          const formattedDate = txDate.toISOString().substring(0, 16).replace('T', ' ');
          
          // Determine the transaction type based on the instruction
          // This is a simplified approach and would need refinement for production
          let txType = 'Transfer';
          let amount = '0 $7F';
          
          // Handle both legacy and versioned transactions properly
          const message = tx.transaction.message;
          
          // Process different transaction message formats (legacy vs versioned)
          let programId: PublicKey | null = null;
          let instructionData: Buffer | null = null;
          
          if ('instructions' in message) {
            // Legacy transaction format
            for (const instruction of message.instructions) {
              // Handle legacy instruction format with proper type checking
              // Get the program ID index - this varies based on transaction version
              let programIdIndex = 0;
              if ('programId' in instruction) {
                // Direct program ID reference
                const programKey = instruction.programId as PublicKey;
                if (programKey.equals(TOKEN_PROGRAM_ID)) {
                  programId = programKey;
                  instructionData = Buffer.from(instruction.data);
                  break;
                }
                continue; // Skip to next instruction if not matching
              } else if ('programIdIndex' in instruction) {
                // Program ID index reference
                programIdIndex = instruction.programIdIndex;
              } else if ('programIndex' in instruction) {
                // Older format program index reference
                programIdIndex = (instruction as any).programIndex;
              }
              
              // Look up the program ID using the index
              const programIdKey = message.accountKeys[programIdIndex];
              
              // Check if this is a token program instruction
              if (programIdKey.equals(TOKEN_PROGRAM_ID)) {
                programId = programIdKey;
                instructionData = Buffer.from(instruction.data);
                break;
              }
            }
          } else if ('compiledInstructions' in message) {
            // Versioned transaction
            for (const instruction of message.compiledInstructions) {
              const programIdKey = message.staticAccountKeys[instruction.programIdIndex];
              
              // Check if this is a token program instruction
              if (programIdKey.equals(TOKEN_PROGRAM_ID)) {
                programId = programIdKey;
                instructionData = Buffer.from(instruction.data);
                break;
              }
            }
          }
          
          // Process the instruction if we found a token program instruction
          if (programId && instructionData && instructionData.length > 0) {
            // Instruction type is the first byte
            // 3 = Transfer, 7 = MintTo, 8 = Burn
            const instructionType = instructionData[0];
            
            if (instructionType === 3) {
              txType = 'Transfer';
            } else if (instructionType === 7) {
              txType = 'Buy'; // MintTo is essentially a buy/creation
            } else if (instructionType === 8) {
              txType = 'Sell'; // Burn is essentially a sell/destruction
            }
          }
          
          // Try to extract the amount from postTokenBalances
          if (tx.meta && tx.meta.postTokenBalances && tx.meta.preTokenBalances) {
            const tokenBalanceChanges = tx.meta.postTokenBalances.map(post => {
              // Find matching pre-balance - ensure preTokenBalances exists
              const preBalances = tx.meta?.preTokenBalances;
              if (!preBalances) return 0;
              
              const pre = preBalances.find(
                preBalance => preBalance.accountIndex === post.accountIndex
              );
              
              if (pre && post.mint === SEVEN_TOKEN_MINT_ADDRESS.toBase58()) {
                const change = Math.abs(
                  Number(post.uiTokenAmount.amount) - Number(pre.uiTokenAmount.amount)
                );
                return change;
              }
              return 0;
            });
            
            // Use the largest change as the transaction amount
            const tokenChanges = tokenBalanceChanges.filter(c => c > 0);
            if (tokenChanges.length > 0) {
              const changeAmount = Math.max(...tokenChanges);
              if (changeAmount > 0) {
                // Format with token decimals
                const formattedAmount = (changeAmount / Math.pow(10, 6)).toString();
                amount = `${formatWithCommas(formattedAmount)} $7F`;
              }
            }
          }
          
          // Calculate reflection and treasury amounts based on transaction amount
          const reflectionRate = ENV.reflectionFeeBps / 10000; // Convert from basis points to decimal
          const treasuryRate = ENV.treasuryFeeBps / 10000; // Convert from basis points to decimal
          
          // Extract numeric amount for calculations
          const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
          
          // Calculate reflection and treasury amounts
          const reflectionAmount = numericAmount * reflectionRate;
          const treasuryAmount = numericAmount * treasuryRate;
          
          // Format amounts with commas
          const reflections = `${formatWithCommas(reflectionAmount.toString())} $7F`;
          const treasury = `${formatWithCommas(treasuryAmount.toString())} $7F`;
          
          return {
            type: txType,
            amount,
            reflections,
            treasury,
            date: formattedDate,
            txHash: `${sig.signature.substring(0, 4)}...${sig.signature.substring(sig.signature.length - 4)}`,
            fullSignature: sig.signature, // Store the full signature for reference
          };
        } catch (error) {
          console.error(`Error processing transaction ${sig.signature}:`, error);
          return null;
        }
      });
      
      // Wait for this batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Add valid results to our transactions array
      batchResults.forEach(result => {
        if (result) {
          transactions.push(result);
        }
      });
    }
    
    console.log(`Processed ${transactions.length} transactions successfully`);
    
    // If we still have no transactions (maybe because of errors), return a placeholder
    if (transactions.length === 0) {
      console.log('No valid transactions found, returning a placeholder transaction');
      
      // Return a placeholder transaction for UI testing
      return [{
        type: 'Transfer',
        amount: '100 $7F',
        date: new Date().toISOString().substring(0, 16).replace('T', ' '),
        txHash: 'Test...Tx',
      }];
    }
    
    return transactions;
  } catch (error) {
    console.error('Error generating transaction history:', error);
    return [];
  }
}

// Removed reflection claim functionality as it's not needed for the simplified token

// Transfer tokens
export async function transferTokens(
  provider: AnchorProvider,
  recipientAddress: string, 
  amount: string
): Promise<string> {
  try {
    if (!provider.wallet || !provider.connection) {
      throw new Error('Wallet not connected');
    }
    
    const senderPublicKey = provider.wallet.publicKey;
    const recipientPublicKey = new PublicKey(recipientAddress);
    const mintPublicKey = SEVEN_TOKEN_MINT_ADDRESS;
    
    // Calculate token amount with decimals
    const tokenDecimals = TOKEN_DECIMALS;
    const amountBN = new BN(amount);
    const adjustedAmount = amountBN.mul(new BN(10).pow(new BN(tokenDecimals)));
    
    // Get sender and recipient token accounts
    const senderTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      senderPublicKey
    );
    
    // Check if recipient token account exists, if not we'll need to create it
    let recipientTokenAccount: PublicKey;
    try {
      recipientTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        recipientPublicKey
      );
      
      // Check if the recipient token account actually exists
      await getAccount(provider.connection, recipientTokenAccount);
    } catch (error) {
      // Account doesn't exist, we'll create it in the transaction
      recipientTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        recipientPublicKey,
        true // Allow the account to be created
      );
    }
    
    console.log(`Sending ${amount} tokens from ${senderPublicKey.toString()} to ${recipientAddress}`);
    
    // Create a new transaction object
    const transaction = new Transaction();
    
    // Check if we need to create the recipient account
    try {
      await getAccount(provider.connection, recipientTokenAccount);
      console.log('Recipient token account exists');
    } catch (error) {
      // Add instruction to create the associated token account if it doesn't exist
      console.log('Creating recipient token account');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          senderPublicKey,
          recipientTokenAccount,
          recipientPublicKey,
          mintPublicKey
        )
      );
    }
    
    // Add the transfer instruction
    transaction.add(
      createTransferInstruction(
        senderTokenAccount,
        recipientTokenAccount,
        senderPublicKey,
        BigInt(adjustedAmount.toString())
      )
    );
    
    // Send and confirm the transaction using the provider
    const signature = await provider.sendAndConfirm(transaction);
    
    console.log('Transfer successful:', signature);
    return signature;
  } catch (error) {
    console.error('Transfer failed:', error);
    throw error;
  }
}

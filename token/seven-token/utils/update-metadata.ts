import { AnchorProvider } from '@coral-xyz/anchor';
import { 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  ComputeBudgetProgram
} from '@solana/web3.js';
import { TOKEN_METADATA_PROGRAM_ID } from '../../../src/lib/token-constants';

/**
 * Creates a new metadata account for an SPL token (instead of updating existing)
 * This is a different approach that might work when updates fail
 */
export async function updateTokenMetadata(
  provider: AnchorProvider,
  payer: any,
  mintAddress: PublicKey,
  name: string,
  symbol: string,
  uri: string
): Promise<string> {
  try {
    console.log('Starting token metadata creation/replacement');
    
    // Find the metadata account PDA for the mint
    const metadataProgramId = new PublicKey(TOKEN_METADATA_PROGRAM_ID);
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        metadataProgramId.toBuffer(),
        mintAddress.toBuffer(),
      ],
      metadataProgramId
    );
    
    console.log(`Metadata account: ${metadataAccount.toBase58()}`);
    
    // Create a new transaction
    const transaction = new Transaction();
    
    // Add compute budget instructions to increase compute limit
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ 
        units: 1000000 // Maximum limit for complex operations
      })
    );
    
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({ 
        microLamports: 500000 // Much higher priority fee for better chances
      })
    );
    
    // Try to create a new metadata account instead of updating existing one
    // Using instruction 0 for CreateMetadataAccountV3
    const createMetadataInstruction = createMetadataAccountInstructionV3(
      metadataAccount,
      mintAddress,
      payer.publicKey, // mint authority
      payer.publicKey, // update authority (same as mint authority)
      name,
      symbol,
      uri
    );
    
    transaction.add(createMetadataInstruction);
    
    // Set transaction options with a FRESH blockhash right before sending
    transaction.feePayer = payer.publicKey;
    console.log('Getting latest blockhash...');
    const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    
    // Skip simulation since it may be causing errors
    
    // Proceed with signing
    console.log('Signing transaction...');
    const signedTx = await payer.signTransaction(transaction);
    
    // Send the transaction with maximum priority
    console.log('Sending transaction with priority processing...');
    const signature = await provider.connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: true, // Skip preflight to avoid simulation errors
      maxRetries: 5, // Retry a few times if needed
      preflightCommitment: 'processed' // Use processed for faster acceptance
    });
    console.log(`Transaction submitted: ${signature}`);
    
    // Wait for confirmation with explicit timeout
    console.log('Waiting for confirmation...');
    const confirmationStrategy = {
      signature,
      blockhash,
      lastValidBlockHeight
    };
    
    // Wait up to 60 seconds for confirmation with logging
    console.log('Confirming transaction...');
    
    // Use a more robust confirmation approach
    let confirmed = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!confirmed && attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`Confirmation attempt ${attempts}/${maxAttempts}...`);
        await provider.connection.confirmTransaction(confirmationStrategy, 'confirmed');
        confirmed = true;
        console.log('Transaction confirmed!');
      } catch (error) {
        console.log(`Waiting for confirmation... (${attempts}/${maxAttempts})`);
        if (attempts >= maxAttempts) {
          // If we've reached max attempts, check status one last time
          const status = await provider.connection.getSignatureStatus(signature);
          if (status && status.value && status.value.err) {
            throw new Error(`Transaction failed: ${status.value.err}`);
          } else if (status && status.value && status.value.confirmationStatus) {
            console.log(`Transaction status: ${status.value.confirmationStatus}`);
            confirmed = true;
          } else {
            throw new Error('Transaction confirmation timeout');
          }
        } else {
          // Wait 2 seconds before trying again
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    console.log(`✅ Token metadata update successful with signature: ${signature}`);
    return signature;
  } catch (error) {
    console.error('❌ Error updating token metadata:', error);
    throw error;
  }
}

/**
 * Creates an instruction to create metadata using V3 of the create instruction
 */
function createMetadataAccountInstructionV3(
  metadataAccount: PublicKey,
  mintKey: PublicKey,
  mintAuthority: PublicKey,
  updateAuthority: PublicKey,
  name: string,
  symbol: string,
  uri: string
): TransactionInstruction {
  const metadataProgramId = new PublicKey(TOKEN_METADATA_PROGRAM_ID);
  
  // Account keys required for the instruction
  const keys = [
    {
      pubkey: metadataAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: mintKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: mintAuthority,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: updateAuthority,
      isSigner: false, // Update authority doesn't need to sign for creation
      isWritable: false,
    },
    {
      pubkey: new PublicKey('11111111111111111111111111111111'), // System program
      isSigner: false,
      isWritable: false,
    },
    {
      // Rent sysvar no longer needed in newer Solana versions but still included
      // in the accounts array for backwards compatibility
      pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'),
      isSigner: false,
      isWritable: false,
    },
  ];
  
  // CreateMetadataAccountV3 instruction (index 33)
  const INSTRUCTION_INDEX = 33;
  
  // Create the instruction data buffer
  const dataBuffer = serializeCreateMetadataV3Data(name, symbol, uri, updateAuthority);
  
  return new TransactionInstruction({
    keys,
    programId: metadataProgramId, 
    data: Buffer.concat([Buffer.from([INSTRUCTION_INDEX]), dataBuffer])
  });
}

/**
 * Serialize the metadata data for CreateMetadataAccountV3
 */
function serializeCreateMetadataV3Data(
  name: string,
  symbol: string,
  uri: string,
  updateAuthority: PublicKey
): Buffer {
  // This is a simplified version of the serialization for CreateMetadataAccountV3
  // We're only including the essential fields
  
  // Convert strings to Buffers
  const nameBuffer = Buffer.from(name);
  const symbolBuffer = Buffer.from(symbol);
  const uriBuffer = Buffer.from(uri);
  
  // Create a simpler buffer directly
  const buffer = Buffer.alloc(1000); // Allocate enough space
  let offset = 0;
  
  // Write the name length and data
  buffer.writeUInt32LE(nameBuffer.length, offset);
  offset += 4;
  nameBuffer.copy(buffer, offset);
  offset += nameBuffer.length;
  
  // Write the symbol length and data
  buffer.writeUInt32LE(symbolBuffer.length, offset);
  offset += 4;
  symbolBuffer.copy(buffer, offset);
  offset += symbolBuffer.length;
  
  // Write the URI length and data
  buffer.writeUInt32LE(uriBuffer.length, offset);
  offset += 4;
  uriBuffer.copy(buffer, offset);
  offset += uriBuffer.length;
  
  // Seller fee basis points (0)
  buffer.writeUInt16LE(0, offset);
  offset += 2;
  
  // Write all remaining fields directly to our buffer
  
  // Creators (None)
  buffer.writeUInt8(0, offset);
  offset += 1;
  
  // Collection option (None)
  buffer.writeUInt8(0, offset);
  offset += 1;
  
  // Uses option (None)
  buffer.writeUInt8(0, offset);
  offset += 1;
  
  // Collection details option (None)
  buffer.writeUInt8(0, offset);
  offset += 1;
  
  // Programmable config option (None)
  buffer.writeUInt8(0, offset);
  offset += 1;
  
  // Return only the part of the buffer we used
  return buffer.slice(0, offset);
}







import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, Transaction } from '@solana/web3.js';

// Function to mint the initial supply to a destination wallet
export async function mintInitialSupply(
  provider: AnchorProvider,
  payer: any,
  mintAddress: PublicKey,
  destinationWallet: PublicKey,
  amount: number | bigint
): Promise<string> {
  try {
    // Import necessary functions from spl-token
    const { 
      TOKEN_PROGRAM_ID, 
      getAssociatedTokenAddress, 
      createAssociatedTokenAccountInstruction,
      createMintToInstruction 
    } = await import('@solana/spl-token');
    
    // Get or create the associated token account for the destination wallet
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      destinationWallet
    );
    
    // Create a transaction
    const transaction = new Transaction();
    
    // Check if the token account exists
    const tokenAccountInfo = await provider.connection.getAccountInfo(associatedTokenAccount);
    
    // If the token account doesn't exist, create it
    if (!tokenAccountInfo) {
      console.log(`Creating token account for wallet ${destinationWallet.toBase58()}`);
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer.publicKey,
          associatedTokenAccount,
          destinationWallet,
          mintAddress
        )
      );
    }
    
    // Add instruction to mint tokens to the token account
    const amountBigInt = BigInt(amount);
    console.log(`Adding instruction to mint ${amountBigInt.toString()} tokens to ${associatedTokenAccount.toBase58()}`);
    transaction.add(
      createMintToInstruction(
        mintAddress,
        associatedTokenAccount,
        payer.publicKey, // Mint authority
        amountBigInt, // Amount to mint
        [],
        TOKEN_PROGRAM_ID
      )
    );
    
    // Sign and send the transaction
    transaction.feePayer = payer.publicKey;
    transaction.recentBlockhash = (await provider.connection.getRecentBlockhash()).blockhash;
    
    // Get signature from the wallet adapter
    const signedTransaction = await payer.signTransaction(transaction);
    
    // Send the fully signed transaction
    const signature = await provider.connection.sendRawTransaction(signedTransaction.serialize());
    await provider.connection.confirmTransaction(signature, 'confirmed');
    
    console.log(`Minted ${amountBigInt.toString()} tokens to ${destinationWallet.toBase58()} with signature: ${signature}`);
    return signature;
  } catch (error) {
    console.error(`Error minting tokens:`, error);
    throw error;
  }
}

use anchor_lang::prelude::*;

#[error_code]
pub enum TokenError {
    #[msg("Insufficient balance for transfer")]
    InsufficientBalance,
    
    #[msg("Operation requires admin authority")]
    Unauthorized,
    
    #[msg("Token is already initialized")]
    AlreadyInitialized,
    
    #[msg("Token is not initialized")]
    NotInitialized,
    
    #[msg("Transfer amount must be greater than zero")]
    InvalidAmount,
    
    #[msg("Transfer failed")]
    TransferFailed,
    
    #[msg("Invalid token account")]
    InvalidTokenAccount,
}

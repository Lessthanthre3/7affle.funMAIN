use anchor_lang::prelude::*;

// Event emitted when token is initialized
#[event]
pub struct TokenInitialized {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub total_supply: u64,
    pub timestamp: i64,
}

// Event emitted on token transfer
#[event]
pub struct TokenTransfer {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

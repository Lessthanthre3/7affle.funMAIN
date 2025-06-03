use anchor_lang::prelude::*;

// Main token state account
#[account]
pub struct TokenConfig {
    pub authority: Pubkey,             // Admin authority that can update parameters
    pub mint: Pubkey,                  // The SPL token mint address
    pub total_supply: u64,             // Total token supply
    pub initialized: bool,             // Whether token is fully initialized
    
    // Padding to maintain compatibility with the original account size
    // These fields replace the removed fee and reflection fields
    pub _padding1: [u8; 32],          // Previously treasury: Pubkey
    pub _padding2: [u8; 8],           // Previously reflection_ratio: u64
    pub _padding3: [u8; 8],           // Previously fee_percent: u64
    pub _padding4: [u8; 320],         // Previously excluded_from_fee: Vec<Pubkey>
    pub _padding5: [u8; 320],         // Previously excluded_from_rewards: Vec<Pubkey>
}

impl TokenConfig {
    pub const SEED_PREFIX: &'static [u8] = b"seven_token_config";
    
    // Space calculation for the account
    pub const SPACE: usize = 8 + // Anchor discriminator
        32 +    // authority: Pubkey
        32 +    // mint: Pubkey
        8 +     // total_supply: u64
        1 +     // initialized: bool
        32 +    // _padding1: [u8; 32]
        8 +     // _padding2: [u8; 8]
        8 +     // _padding3: [u8; 8]
        320 +   // _padding4: [u8; 320]
        320;    // _padding5: [u8; 320]
}

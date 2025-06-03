use anchor_lang::prelude::*;

mod state;
mod errors;
mod events;
mod instructions;

use crate::instructions::*;

declare_id!("GaQcSCxSu3iWk7C6oxPm9aBavuK5GaWJguRcbx7AFFLE");

#[program]
pub mod seven_token {
    use super::*;

    // Initialize the standard token with total supply
    pub fn initialize(
        ctx: Context<Initialize>,
        total_supply: u64,
    ) -> Result<()> {
        instructions::initialize(ctx, total_supply)
    }

    // Transfer tokens (standard SPL token transfer)
    pub fn transfer(
        ctx: Context<TransferTokens>,
        amount: u64,
    ) -> Result<()> {
        instructions::transfer(ctx, amount)
    }
}

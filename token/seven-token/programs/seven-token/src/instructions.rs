use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use anchor_spl::token::{self, Token, Transfer};

// This is necessary for init_if_needed to work - make sure the feature is enabled in Cargo.toml

use crate::errors::TokenError;
use crate::events::*;
use crate::state::*;

// Initialize the standard token
pub fn initialize(
    ctx: Context<Initialize>,
    total_supply: u64,
) -> Result<()> {
    require!(!ctx.accounts.token_config.initialized, TokenError::AlreadyInitialized);
    require!(total_supply > 0, TokenError::InvalidAmount);

    let current_time = Clock::get()?.unix_timestamp;
    
    // Initialize token config
    let token_config = &mut ctx.accounts.token_config;
    token_config.authority = ctx.accounts.authority.key();
    token_config.mint = ctx.accounts.mint.key();
    token_config.total_supply = total_supply;
    token_config.initialized = true;
    
    // Emit initialization event
    emit!(TokenInitialized {
        authority: ctx.accounts.authority.key(),
        mint: ctx.accounts.mint.key(),
        total_supply,
        timestamp: current_time,
    });
    
    Ok(())
}

// Transfer tokens (standard SPL token transfer)
pub fn transfer(
    ctx: Context<TransferTokens>,
    amount: u64,
) -> Result<()> {
    require!(ctx.accounts.token_config.initialized, TokenError::NotInitialized);
    require!(amount > 0, TokenError::InvalidAmount);
    
    // Get token account amounts to verify they are valid accounts
    let _ = token::accessor::amount(&ctx.accounts.from_token_account)?;
    let _ = token::accessor::amount(&ctx.accounts.to_token_account)?;
    
    // Perform a standard transfer with no fees
    let cpi_accounts = Transfer {
        from: ctx.accounts.from_token_account.to_account_info(),
        to: ctx.accounts.to_token_account.to_account_info(),
        authority: ctx.accounts.from.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;
    
    // Emit event for tracking transfers
    let current_time = Clock::get()?.unix_timestamp;
    emit!(TokenTransfer {
        from: ctx.accounts.from.key(),
        to: ctx.accounts.to.key(),
        amount,
        timestamp: current_time,
    });
    
    Ok(())
}

// All fee and reflection-related functions have been removed as part of simplifying the token contract
    
// This section has been removed as part of simplifying the token contract to remove fee and reflection functionality

// Account contexts for instructions

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Mint account is verified by the token program
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Verified through token account
    pub mint: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = authority,
        space = TokenConfig::SPACE,
        seeds = [TokenConfig::SEED_PREFIX],
        bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    
    /// CHECK: Verified through token account
    pub to: UncheckedAccount<'info>,
    
    /// CHECK: Validated by token program
    #[account(
        mut
    )]
    pub from_token_account: UncheckedAccount<'info>,
    
    /// CHECK: Validated by token program
    #[account(
        mut
    )]
    pub to_token_account: UncheckedAccount<'info>,
    
    #[account(
        mut,
        seeds = [TokenConfig::SEED_PREFIX],
        bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    pub token_program: Program<'info, Token>,
}

// Reflection-related context structures have been removed

// Fee and reflection-related context structures have been removed

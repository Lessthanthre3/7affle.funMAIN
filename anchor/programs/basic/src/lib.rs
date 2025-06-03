use anchor_lang::prelude::*;
use std::mem::size_of;
use anchor_lang::solana_program::{clock::Clock, program::invoke, system_instruction};

declare_id!("GUXx1x2kMBxJwLmyxWJMaWAqMhJHx7zabDqHdv7AFFLE");

// Define platform fee (5%)
const PLATFORM_FEE_PERCENT: u8 = 5;

// Maximum number of tickets for bitmap size calculation
const MAX_BITMAP_SIZE: usize = 10000;

// Number of bits in a byte for bit packing
const BITS_PER_BYTE: usize = 8;

// Number of top players for weekly and monthly leaderboards
#[allow(dead_code)]
const WEEKLY_TOP_PLAYERS: usize = 50;
#[allow(dead_code)]
const MONTHLY_TOP_PLAYERS: usize = 100;

// Prize distribution percentages for monthly winners (first, second, third place)
#[allow(dead_code)]
const MONTHLY_PRIZE_DISTRIBUTION: [u8; 3] = [60, 30, 10];

#[program]
pub mod basic {
    use super::*;
    
    // Initialize the program counter (called once during program deployment)
    pub fn initialize_program_counter(ctx: Context<InitializeProgramCounter>) -> Result<()> {
        let counter = &mut ctx.accounts.program_counter;
        counter.authority = ctx.accounts.authority.key();
        counter.raffle_count = 0;
        
        msg!("Program counter initialized");
        Ok(())
    }

    // Initialize a new raffle
    pub fn initialize_raffle(
        ctx: Context<InitializeRaffle>,
        name: String,
        description: String,
        ticket_price: u64,
        duration_hours: u64,
        max_tickets: u32,
    ) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        let counter = &mut ctx.accounts.program_counter;
        let authority = &ctx.accounts.authority;
        let clock = Clock::get()?;
        
        // Validate inputs
        require!(duration_hours > 0, RaffleError::InvalidDuration);
        require!(duration_hours <= 30 * 24, RaffleError::DurationTooLong); // Max 30 days
        require!(max_tickets > 0, RaffleError::InvalidTicketCount);
        require!(ticket_price > 0, RaffleError::InvalidTicketPrice);
        require!(max_tickets <= MAX_BITMAP_SIZE as u32, RaffleError::TooManyTickets);
        
        // Increment counter and generate unique ID
        counter.raffle_count += 1;
        let id_number = format!("{:03}", counter.raffle_count);
        let raffle_id = format!("7F-SOL-{}", id_number);
        
        // Set up raffle parameters
        raffle.authority = authority.key();
        raffle.name = name.clone();
        raffle.description = description;
        raffle.ticket_price = ticket_price;
        raffle.start_timestamp = clock.unix_timestamp;
        raffle.end_timestamp = clock.unix_timestamp + (duration_hours * 3600) as i64; // Convert hours to seconds
        raffle.max_tickets = max_tickets;
        raffle.total_tickets = 0;
        raffle.is_active = true;
        raffle.winner = None;
        raffle.raffle_id = raffle_id.clone();
        
        // Initialize the bitmap for tracking used ticket numbers using bit packing (8 tickets per byte)
        // Calculate how many bytes we need: ceiling of max_tickets / 8
        let bytes_needed = (max_tickets as usize + BITS_PER_BYTE - 1) / BITS_PER_BYTE;
        raffle.used_numbers = vec![0u8; bytes_needed];
        
        msg!("Raffle '{}' (ID: {}) initialized with ticket price: {} SOL", 
             raffle.name, raffle_id, ticket_price / 1_000_000_000);
        msg!("Platform fee: {}%", PLATFORM_FEE_PERCENT);
        
        Ok(())
    }

    // Buy a ticket for a raffle
    pub fn buy_ticket(ctx: Context<BuyTicket>, _bump: u8) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        let buyer = &ctx.accounts.buyer;
        let ticket = &mut ctx.accounts.ticket;
        let user_stats = &mut ctx.accounts.user_stats;
        let participant_flag = &mut ctx.accounts.participant_flag;
        let clock = Clock::get()?;
        
        // Check if raffle is active and not ended
        require!(raffle.is_active, RaffleError::RaffleNotActive);
        require!(clock.unix_timestamp < raffle.end_timestamp, RaffleError::RaffleEnded);
        require!(raffle.total_tickets < raffle.max_tickets, RaffleError::RaffleFull);
        
        // Transfer SOL from buyer to raffle account
        invoke(
            &system_instruction::transfer(
                buyer.key,
                raffle.to_account_info().key,
                raffle.ticket_price,
            ),
            &[
                buyer.to_account_info(),
                raffle.to_account_info(),
            ],
        )?;
        
        // Track unique participants
        if participant_flag.raffle.to_bytes() == [0; 32] {
            // Initialize the participant flag
            participant_flag.raffle = raffle.key();
            participant_flag.participant = buyer.key();
            
            // Increment unique entrants counter
            raffle.unique_entrants += 1;
            msg!("New unique entrant: {}. Total unique entrants: {}", buyer.key(), raffle.unique_entrants);
        }
        
        // Update user statistics for leaderboard
        user_stats.total_tickets_purchased += 1;
        
        // Update current week and month statistics
        let current_week = get_week_number(clock.unix_timestamp);
        let current_month = get_month_number(clock.unix_timestamp);
        
        if user_stats.current_week != current_week {
            user_stats.current_week = current_week;
            user_stats.weekly_tickets = 0;
        }
        
        if user_stats.current_month != current_month {
            user_stats.current_month = current_month;
            user_stats.monthly_tickets = 0;
        }
        
        user_stats.weekly_tickets += 1;
        user_stats.monthly_tickets += 1;
        
        // Generate a random ticket number
        let random_seed = clock.unix_timestamp
            .wrapping_add(clock.slot as i64)
            .wrapping_add(buyer.key().to_bytes()[0] as i64);
        
        // Find an unused ticket number - starting from 1 (not 0)
        let max_tickets = raffle.max_tickets;
        // Generate a number between 1 and max_tickets (inclusive)
        let mut ticket_number = ((random_seed as u64 % max_tickets as u64) as u32) + 1;
        
        // Linear probing to find unused number
        let start_position = ticket_number;
        loop {
            // Convert ticket_number (1-based) to bitmap index (0-based)
            let bitmap_index = ticket_number - 1;
            // Check if this ticket is unused using bit operations
            let byte_index = bitmap_index as usize / BITS_PER_BYTE;
            let bit_index = bitmap_index as usize % BITS_PER_BYTE;
            let bit_mask = 1u8 << bit_index;
            
            if (raffle.used_numbers[byte_index] & bit_mask) == 0 {
                // Found an unused number - mark it as used
                raffle.used_numbers[byte_index] |= bit_mask;
                break;
            }
            
            // Try the next number, ensuring we stay within range 1 to max_tickets
            ticket_number = (ticket_number % max_tickets) + 1;
            
            // If we've checked all numbers, there's a bug
            if ticket_number == start_position {
                return Err(RaffleError::NoAvailableTickets.into());
            }
        }
        
        // Initialize the ticket with the random number
        ticket.buyer = buyer.key();
        ticket.raffle = raffle.key();
        ticket.ticket_number = ticket_number;
        
        // Update the raffle state
        raffle.total_tickets += 1;
        
        // Check if raffle is now sold out, if so, draw winner immediately
        if raffle.total_tickets == raffle.max_tickets {
            msg!("Raffle sold out! Drawing winner...");
            raffle.is_active = false;
            
            // Generate a pseudo-random winner from the sold tickets
            let random_seed = clock.unix_timestamp.wrapping_add(clock.slot as i64);
            
            // We need to select from actual sold tickets, not just any number
            // Randomly select a position in the used_numbers array where value is true
            let mut available_tickets = Vec::new();
            for i in 0..raffle.max_tickets {
                // Convert to bitmap index (0-based)
                let bitmap_index = i;
                let byte_index = bitmap_index as usize / BITS_PER_BYTE;
                let bit_index = bitmap_index as usize % BITS_PER_BYTE;
                let bit_mask = 1u8 << bit_index;
                
                if (raffle.used_numbers[byte_index] & bit_mask) != 0 {
                    // Push ticket number (1-based)
                    available_tickets.push(i + 1);
                }
            }
            
            let winner_index = (random_seed as u64 % available_tickets.len() as u64) as usize;
            let winner_ticket = available_tickets[winner_index];
            
            // Set the winner
            raffle.winner = Some(winner_ticket);
            
            msg!("Winner drawn: Ticket #{}", winner_ticket);
        }
        
        msg!("Ticket #{} purchased by: {}", ticket_number, buyer.key());
        Ok(())
    }

    // Draw a winner for the raffle when time expires
    pub fn draw_winner(ctx: Context<DrawWinner>) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        let authority = &ctx.accounts.authority;
        let clock = Clock::get()?;
        
        // Only the raffle creator can draw a winner
        require!(raffle.authority == authority.key(), RaffleError::UnauthorizedAccess);
        
        // Check if raffle has ended
        require!(clock.unix_timestamp >= raffle.end_timestamp, RaffleError::RaffleNotEnded);
        
        // Check if tickets were sold
        require!(raffle.total_tickets > 0, RaffleError::NoTicketsSold);
        
        // Generate a pseudo-random winner from the sold tickets
        let random_seed = clock.unix_timestamp.wrapping_add(clock.slot as i64);
        
        // We need to select from actual sold tickets, not just any number
        // Collect all purchased ticket numbers
        let mut available_tickets = Vec::new();
        for i in 0..raffle.max_tickets {
            // Convert to bitmap index (0-based)
            let bitmap_index = i;
            let byte_index = bitmap_index as usize / BITS_PER_BYTE;
            let bit_index = bitmap_index as usize % BITS_PER_BYTE;
            let bit_mask = 1u8 << bit_index;
            
            if byte_index < raffle.used_numbers.len() && (raffle.used_numbers[byte_index] & bit_mask) != 0 {
                // Push ticket number (1-based)
                available_tickets.push(i + 1);
            }
        }
        
        // If there are no available tickets, return error
        require!(!available_tickets.is_empty(), RaffleError::NoAvailableTickets);
        
        // Get a pseudo-random index based on the random seed
        let selected_index = (random_seed as usize) % available_tickets.len();
        let winning_ticket = available_tickets[selected_index];
        
        // Mark raffle as inactive
        raffle.is_active = false;
        
        // Store the winning ticket number
        raffle.winner = Some(winning_ticket);
        
        msg!("Winner drawn for raffle '{}': ticket #{}", raffle.name, winning_ticket);
        
        Ok(())
    }

    // Claim prize by the winner
    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        let winner = &ctx.accounts.winner;
        let winning_ticket = &ctx.accounts.winning_ticket;
        let authority = &ctx.accounts.authority;
        let history = &mut ctx.accounts.raffle_history;
        let clock = Clock::get()?;
        
        // Verify the raffle has a winner
        let winner_ticket_number = raffle.winner.ok_or(RaffleError::NoWinnerDrawn)?;
        
        // Check this is the winning ticket
        require!(winning_ticket.ticket_number == winner_ticket_number, RaffleError::NotWinningTicket);
        
        // Check the caller is the ticket owner
        require!(winning_ticket.buyer == winner.key(), RaffleError::NotTicketOwner);
        
        // Calculate prize amount (95% of pool)
        let total_pot = raffle.ticket_price.checked_mul(raffle.total_tickets as u64).unwrap();
        let winner_amount = total_pot.checked_mul(95).unwrap().checked_div(100).unwrap();
        let platform_fee = total_pot.checked_mul(PLATFORM_FEE_PERCENT as u64).unwrap().checked_div(100).unwrap();
        
        // Transfer prize to winner
        **raffle.to_account_info().try_borrow_mut_lamports()? -= winner_amount;
        **winner.to_account_info().try_borrow_mut_lamports()? += winner_amount;
        
        // Transfer platform fee to authority
        **raffle.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
        **authority.to_account_info().try_borrow_mut_lamports()? += platform_fee;
        
        // Create raffle history record
        history.raffle_id = raffle.raffle_id.clone();
        history.raffle_name = raffle.name.clone();
        history.creation_timestamp = raffle.start_timestamp;
        history.end_timestamp = raffle.end_timestamp;
        history.total_tickets_sold = raffle.total_tickets;
        history.max_tickets = raffle.max_tickets;
        history.final_prize_amount = winner_amount;
        history.winner_ticket = winner_ticket_number;
        history.winner_address = winner.key();
        history.claim_timestamp = clock.unix_timestamp;
        // The transaction signature will be populated by the frontend
        history.transaction_signature = String::new();
        
        msg!("Prize of {} lamports claimed by {}", winner_amount, winner.key());
        msg!("Platform fee of {} lamports paid to {}", platform_fee, authority.key());
        msg!("Raffle history record created for {}", raffle.raffle_id);
        
        Ok(())
    }

    // Cancel a raffle (only possible if no tickets sold)
    pub fn cancel_raffle(ctx: Context<CancelRaffle>) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        let authority = &ctx.accounts.authority;
        
        // Verify authority
        require!(raffle.authority == authority.key(), RaffleError::UnauthorizedAccess);
        
        // Check if no tickets sold
        require!(raffle.total_tickets == 0, RaffleError::CannotCancelActive);
        
        // Mark raffle as inactive
        raffle.is_active = false;
        
        msg!("Raffle canceled");
        Ok(())
    }
    
    // Initialize user stats for tracking ticket purchases and leaderboard status
    pub fn initialize_user_stats(ctx: Context<InitializeUserStats>) -> Result<()> {
        let user_stats = &mut ctx.accounts.user_stats;
        let user = &ctx.accounts.user;
        let clock = Clock::get()?;
        
        // Initialize user stats
        user_stats.user = user.key();
        user_stats.total_tickets_purchased = 0;
        user_stats.weekly_tickets = 0;
        user_stats.monthly_tickets = 0;
        
        // Get current week and month
        // We use unix timestamp / (seconds in a day * 7) to get current week number
        // and unix timestamp / (seconds in a day * 30) to get approximate month
        let current_week = (clock.unix_timestamp / (86400 * 7)) as u32;
        let current_month = (clock.unix_timestamp / (86400 * 30)) as u32;
        
        user_stats.current_week = current_week;
        user_stats.current_month = current_month;
        
        msg!("User stats initialized for {}", user.key());
        Ok(())
    }
}

// Program counter to track raffle IDs
#[account]
pub struct ProgramCounter {
    pub authority: Pubkey,         // Program admin
    pub raffle_count: u32,         // Number of raffles created
}

// Raffle account structure
#[account]
pub struct Raffle {
    pub authority: Pubkey,         // Creator of the raffle
    pub name: String,              // Name of the raffle
    pub description: String,       // Description of the raffle
    pub ticket_price: u64,         // Price per ticket in lamports
    pub start_timestamp: i64,      // When the raffle starts
    pub end_timestamp: i64,        // When the raffle ends
    pub max_tickets: u32,          // Maximum number of tickets
    pub total_tickets: u32,        // Number of tickets sold
    pub is_active: bool,           // Whether the raffle is active
    pub winner: Option<u32>,       // Winning ticket number
    pub raffle_id: String,         // Unique raffle ID (e.g., "7F-SOL-001")
    pub used_numbers: Vec<u8>,   // Bit-packed bitmap to track used ticket numbers (8 tickets per byte)
    pub unique_entrants: u32,      // Number of unique wallets that have entered the raffle
}

// Raffle history account structure
#[account]
pub struct RaffleHistory {
    pub raffle_id: String,         // Unique raffle ID
    pub raffle_name: String,       // Name of the raffle
    pub creation_timestamp: i64,   // When the raffle was created
    pub end_timestamp: i64,        // When the raffle ended
    pub total_tickets_sold: u32,   // Number of tickets sold
    pub max_tickets: u32,          // Maximum number of tickets
    pub final_prize_amount: u64,   // Final prize amount in lamports
    pub winner_ticket: u32,        // Winning ticket number
    pub winner_address: Pubkey,    // Winner's wallet address
    pub claim_timestamp: i64,      // When the prize was claimed
    pub transaction_signature: String, // Transaction signature for the claim
}

// Ticket account structure
#[account]
pub struct Ticket {
    pub buyer: Pubkey,                   // Buyer of the ticket
    pub raffle: Pubkey,                   // Raffle the ticket belongs to
    pub ticket_number: u32,               // Ticket number
}

// Participant flag account to track unique entrants per raffle
#[account]
pub struct ParticipantFlag {
    pub raffle: Pubkey,     // The raffle this participation is for
    pub participant: Pubkey, // The participant's wallet address
}

// User stats account structure for leaderboard tracking
#[account]
pub struct UserStats {
    pub user: Pubkey,                    // User wallet address
    pub total_tickets_purchased: u32,     // Total tickets purchased all-time
    pub weekly_tickets: u32,              // Tickets purchased in current week
    pub monthly_tickets: u32,             // Tickets purchased in current month
    pub current_week: u32,                // Current week number
    pub current_month: u32,               // Current month number
}

// Leaderboard account structure for tracking top players and prize distribution
#[account]
pub struct Leaderboard {
    pub admin: Pubkey,                   // Admin address that can update leaderboard
    
    // Weekly tracking
    pub last_weekly_distribution: u32,    // Last week number when prizes were distributed
    pub weekly_prize_amount: u64,         // Weekly prize amount in lamports
    pub weekly_winner: Pubkey,            // Weekly winner address
    pub weekly_winner_tickets: u32,       // Number of tickets purchased by weekly winner
    
    // Monthly tracking
    pub last_monthly_distribution: u32,   // Last month number when prizes were distributed
    pub monthly_prize_amount: u64,        // Monthly prize pool amount in lamports
    pub monthly_first_place: Pubkey,      // First place winner address
    pub monthly_second_place: Pubkey,     // Second place winner address
    pub monthly_third_place: Pubkey,      // Third place winner address
    pub monthly_first_place_tickets: u32, // Number of tickets purchased by first place
    pub monthly_second_place_tickets: u32, // Number of tickets purchased by second place
    pub monthly_third_place_tickets: u32, // Number of tickets purchased by third place
}

// Context for initializing the program counter
#[derive(Accounts)]
pub struct InitializeProgramCounter<'info> {
    #[account(init, payer = authority, space = 8 + size_of::<ProgramCounter>(), 
             seeds = [b"program-counter"], bump)]
    pub program_counter: Account<'info, ProgramCounter>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for initializing a raffle
#[derive(Accounts)]
pub struct InitializeRaffle<'info> {
    #[account(init, payer = authority, space = 8 + size_of::<Raffle>() + 500)]
    pub raffle: Account<'info, Raffle>,
    
    #[account(mut, seeds = [b"program-counter"], bump)]
    pub program_counter: Account<'info, ProgramCounter>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for buying a ticket
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct BuyTicket<'info> {
    #[account(mut)]
    pub raffle: Account<'info, Raffle>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(init, payer = buyer, space = 8 + size_of::<Ticket>(), seeds = [b"ticket", raffle.key().as_ref(), &raffle.total_tickets.to_le_bytes()], bump)]
    pub ticket: Account<'info, Ticket>,
    
    #[account(mut, seeds = [b"user-stats", buyer.key().as_ref()], bump)]
    pub user_stats: Account<'info, UserStats>,
    
    // This account is created to track unique entrants
    // Using a separate flag account to track first-time participants
    #[account(init_if_needed, payer = buyer, space = 8 + size_of::<ParticipantFlag>(),
              seeds = [b"participant", raffle.key().as_ref(), buyer.key().as_ref()],
              bump)]
    pub participant_flag: Account<'info, ParticipantFlag>,
    
    pub system_program: Program<'info, System>,
}

// Context for initializing user stats
#[derive(Accounts)]
pub struct InitializeUserStats<'info> {
    #[account(init, payer = user, space = 8 + size_of::<UserStats>(), seeds = [b"user-stats", user.key().as_ref()], bump)]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for initializing leaderboard
#[derive(Accounts)]
pub struct InitializeLeaderboard<'info> {
    #[account(init, payer = admin, space = 8 + size_of::<Leaderboard>() + 200)]
    pub leaderboard: Account<'info, Leaderboard>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for distributing weekly prizes
#[derive(Accounts)]
pub struct DistributeWeeklyPrizes<'info> {
    #[account(mut)]
    pub leaderboard: Account<'info, Leaderboard>,
    
    pub authority: Signer<'info>,
}

// Context for setting weekly winner
#[derive(Accounts)]
pub struct SetLeaderboardWinner<'info> {
    #[account(mut)]
    pub leaderboard: Account<'info, Leaderboard>,
    
    pub authority: Signer<'info>,
}

// Context for distributing monthly prizes
#[derive(Accounts)]
pub struct DistributeMonthlyPrizes<'info> {
    #[account(mut)]
    pub leaderboard: Account<'info, Leaderboard>,
    
    pub authority: Signer<'info>,
}

// Context for setting monthly winners
#[derive(Accounts)]
pub struct SetMonthlyWinners<'info> {
    #[account(mut)]
    pub leaderboard: Account<'info, Leaderboard>,
    
    pub authority: Signer<'info>,
}

// Context for drawing a winner
#[derive(Accounts)]
pub struct DrawWinner<'info> {
    #[account(mut)]
    pub raffle: Account<'info, Raffle>,
    
    pub authority: Signer<'info>,
}

// Context for claiming a prize
#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub raffle: Account<'info, Raffle>,
    
    #[account(mut)]
    pub winner: Signer<'info>,
    
    #[account(constraint = winning_ticket.raffle == raffle.key())]
    pub winning_ticket: Account<'info, Ticket>,
    
    /// CHECK: This is the authority that receives the platform fee
    #[account(mut)]
    pub authority: AccountInfo<'info>,
    
    #[account(init, payer = winner, space = 8 + size_of::<RaffleHistory>() + 300)]
    pub raffle_history: Account<'info, RaffleHistory>,
    
    pub system_program: Program<'info, System>,
}

// Context for canceling a raffle
#[derive(Accounts)]
pub struct CancelRaffle<'info> {
    #[account(mut)]
    pub raffle: Account<'info, Raffle>,
    
    pub authority: Signer<'info>,
}

// Error enum for the raffle program
#[error_code]
pub enum RaffleError {
    #[msg("The raffle is not active")]
    RaffleNotActive,
    
    #[msg("The raffle has already ended")]
    RaffleEnded,
    
    #[msg("The raffle is full")]
    RaffleFull,
    
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
    
    #[msg("The raffle has not ended yet")]
    RaffleNotEnded,
    
    #[msg("No tickets have been sold")]
    NoTicketsSold,
    
    #[msg("No winner has been drawn")]
    NoWinnerDrawn,
    
    #[msg("This is not the winning ticket")]
    NotWinningTicket,
    
    #[msg("You are not the owner of this ticket")]
    NotTicketOwner,
    
    #[msg("Cannot cancel a raffle with active tickets")]
    CannotCancelActive,
    
    #[msg("Invalid duration for raffle")]
    InvalidDuration,
    
    #[msg("Duration too long, maximum is 30 days")]
    DurationTooLong,
    
    #[msg("Invalid ticket count")]
    InvalidTicketCount,
    
    #[msg("Invalid ticket price")]
    InvalidTicketPrice,
    
    #[msg("No available ticket numbers")]
    NoAvailableTickets,
    
    #[msg("Too many tickets for a single raffle")]
    TooManyTickets,
    
    #[msg("Cannot update ticket price after tickets have been sold")]
    CannotUpdatePrice,
    
    #[msg("Prizes have already been distributed for this period")]
    AlreadyDistributed,
    
    #[msg("Invalid prize amount")]
    InvalidPrizeAmount,
}

// Helper function to get the week number from a timestamp
// Weeks start from Unix epoch and increment every 7 days
fn get_week_number(timestamp: i64) -> u32 {
    // Each week is 7 days * 24 hours * 60 minutes * 60 seconds
    const SECONDS_PER_WEEK: i64 = 7 * 24 * 60 * 60;
    (timestamp / SECONDS_PER_WEEK) as u32
}

// Helper function to get the month number from a timestamp
// This is a simplified version that assumes 30 days per month
fn get_month_number(timestamp: i64) -> u32 {
    // Each month is approximately 30 days * 24 hours * 60 minutes * 60 seconds
    const SECONDS_PER_MONTH: i64 = 30 * 24 * 60 * 60;
    (timestamp / SECONDS_PER_MONTH) as u32
}

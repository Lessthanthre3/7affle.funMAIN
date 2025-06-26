# 7affle - Solana Raffle Platform

*Last updated: 2025-01-26 - Mainnet Launch Ready! 🚀*

## Overview

7affle is a decentralized raffle platform built on the Solana blockchain. It allows users to create raffles, purchase tickets, and win prizes in a transparent and trustless manner. The platform includes an admin panel for raffle management and a user-friendly interface for participants.

## Project Structure

```
7afflefun/
├── anchor/                # Solana smart contract code
│   ├── programs/          # Anchor programs
│   │   ├── basic/         # Main raffle program
│   │   │   ├── src/       # Rust source code
│   │   │   │   └── lib.rs # Main program file
│   ├── tests/             # Program tests
├── src/                   # Frontend source code
│   ├── basic/             # Raffle UI components
│   │   ├── admin-panel.tsx          # Admin interface
│   │   ├── basic-data-access.tsx    # Data hooks and utilities
│   │   ├── basic-ui.tsx             # Main UI components
│   │   ├── my-tickets.tsx           # User tickets view
│   │   ├── raffle-history.tsx       # Raffle history display
│   ├── components/        # Reusable UI components
│   ├── styles/            # CSS and styling
```

## Smart Contract Features

### Core Components

1. **Program Counter**: A global counter to track the number of raffles created on the platform.
2. **Raffle**: The main data structure that stores raffle information including name, description, ticket price, duration, max tickets, and winner information.
3. **Ticket**: Represents a purchased ticket with a unique number and buyer information.
4. **Raffle History**: Records completed raffles and their outcomes for historical reference.

### Key Functions

1. **initialize_program_counter**: Sets up the platform for the first time (admin only).
2. **initialize_raffle**: Creates a new raffle with specified parameters.
3. **buy_ticket**: Allows users to purchase tickets for active raffles.
4. **draw_winner**: Selects a random winner when the raffle ends (time-based or sold out).
5. **claim_prize**: Transfers the prize funds to the winner.
6. **cancel_raffle**: Allows the authority to cancel a raffle if no tickets have been sold.

### Error Handling

The smart contract includes comprehensive error handling for scenarios such as:
- Unauthorized access attempts
- Invalid raffle parameters
- Ticket purchase failures
- Prize claiming issues

## Frontend Features

### User Interface Components

1. **RaffleCard**: Displays raffle information and allows ticket purchase and prize claiming.
2. **MyTickets**: Shows tickets owned by the current user.
3. **RaffleHistory**: Displays completed raffles with their outcomes and status (claimed/unclaimed).
4. **AdminPanel**: Admin-only interface for managing raffles and drawing winners.

### Data Management

1. **useBasicProgram**: Custom hook that provides access to all program functions and data.
2. **fetchRaffles**: Function to retrieve all raffles from the blockchain.
3. **claimPrize**: Enhanced function to handle prize claiming with auto-drawing capability.
4. **drawWinner**: Function to select a winner for a raffle.

## Prize Claiming Process

The prize claiming process includes several steps:

1. **Winner Selection**:
   - Automatically occurs when the raffle end time is reached or all tickets are sold
   - Can be manually triggered by an admin
   - Uses a pseudo-random algorithm based on blockchain timestamps and slots

2. **Prize Distribution**:
   - Winner receives 95% of the total raffle pool
   - Platform fee of 5% goes to the authority address
   - The transaction is recorded in the raffle history

3. **Status Tracking**:
   - Raffles show "Claimed" or "Unclaimed" status in the history view
   - The UI disables the "Claim Prize" button once a prize has been claimed

## Development Environment Setup

### Prerequisites

- Node.js (v14+)
- Rust and Cargo
- Solana CLI tools
- Anchor framework

### Local Development

1. **Start the local validator**:
   ```
   solana-test-validator --reset
   ```

2. **Build and deploy the Anchor program**:
   ```
   cd anchor
   anchor build
   anchor deploy
   ```

3. **Start the frontend**:
   ```
   cd 7afflefun
   npm install
   npm run dev
   ```

### Testing the Platform

1. **Initialize the program counter** using the admin panel
2. **Create a raffle** with desired parameters
3. **Purchase tickets** using a connected wallet
4. **Wait for the raffle to end** or sell out
5. **Draw a winner** (admin) or let it auto-draw when conditions are met
6. **Claim the prize** if you're the winner

## Troubleshooting

### Common Issues

1. **Winner Not Being Drawn**:
   - Ensure the raffle has ended (time expired) or is sold out
   - Verify that the caller has proper authority permissions
   - Check that tickets have been sold for the raffle

2. **Prize Claiming Failures**:
   - Ensure a winner has been drawn
   - Verify you're the owner of the winning ticket
   - Check that the correct ticket number is being used

3. **State Inconsistencies**:
   - Reset the local validator to clear any blockchain state issues
   - Redeploy the program after resetting the validator
   - Initialize the program counter again before creating new raffles

## Future Enhancements

1. **Multiple Prize Tiers**: Support for raffles with multiple winners and prize amounts
2. **Token Support**: Enable raffles that use SPL tokens instead of SOL
3. **Advanced Randomness**: Implement more robust randomness sources
4. **Social Features**: Add social sharing and notifications
5. **Mobile Optimization**: Enhance mobile responsiveness and experience

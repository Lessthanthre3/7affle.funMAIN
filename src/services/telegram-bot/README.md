# 7affle Telegram Bot

A Telegram bot that monitors the Solana blockchain for new raffle creations and automatically announces them to a channel.

## Features

- Monitors the Solana blockchain for new raffle initializations
- Sends notifications to a Telegram channel when new raffles are detected
- Includes raffle details like name, ID, ticket price, and end time
- Prevents duplicate announcements
- Automatic retry on connection issues
- Configurable polling intervals

## Prerequisites

- Node.js 16+ installed
- NPM or Yarn for package management
- A Telegram bot token (obtain from BotFather)
- A Telegram channel or group where the bot has permission to post messages

## Setup Instructions

1. **Create a Telegram Bot**
   - Open Telegram and search for "BotFather" (@BotFather)
   - Send the command `/newbot` and follow the instructions
   - Save the API token provided by BotFather

2. **Add Bot to Your Channel**
   - Create a channel or use an existing one
   - Add your bot as an administrator to the channel
   - Make sure it has permission to post messages

3. **Get Your Channel ID**
   - For public channels, use `@your_channel_name`
   - For private channels, you'll need to get the numeric ID (use @username_to_id_bot to help)

4. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` and add:
     - Your bot token
     - Your channel ID
     - Solana RPC endpoint (optional, default is public mainnet)
     - Other configuration options

5. **Install Dependencies**
   ```bash
   npm install
   ```

6. **Build the Project**
   ```bash
   npm run build
   ```

7. **Run the Bot**
   ```bash
   npm start
   ```

## Configuration Options

The following environment variables can be configured in the `.env` file:

- `TELEGRAM_BOT_TOKEN`: Your bot's API token (required)
- `TELEGRAM_CHANNEL_ID`: ID of the channel for announcements (required)
- `SOLANA_RPC_URL`: URL for Solana RPC endpoint (optional)
- `SOLANA_NETWORK`: "mainnet" or "devnet" (optional, defaults to mainnet)
- `POLLING_INTERVAL_MS`: How often to check for new raffles in milliseconds (default: 60000)
- `RETRY_DELAY_MS`: Delay before retrying after a connection error (default: 5000)
- `RAFFLE_PROGRAM_ID`: Program ID for the raffle program (default: GUXx1x2kMBxJwLmyxWJMaWAqMhJHx7zabDqHdv7AFFLE)

## Running as a Service

For production use, it's recommended to run the bot as a service using a process manager like PM2.

```bash
npm install -g pm2
pm2 start dist/index.js --name "7affle-telegram-bot"
pm2 save
pm2 startup
```

## Logs

Logs are written to both the console and a file called `telegram-bot.log`. You can view the logs using:

```bash
tail -f telegram-bot.log
```

## License

Copyright (c) 2025 7affle Team. All rights reserved.

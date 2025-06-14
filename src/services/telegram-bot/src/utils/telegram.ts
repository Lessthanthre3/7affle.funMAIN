import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import logger from './logger';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Get bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required in .env file');
}

if (!channelId) {
  throw new Error('TELEGRAM_CHANNEL_ID is required in .env file');
}

// Admin user IDs - add your Telegram user ID here
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => Number(id.trim())) : [];

// Create a bot instance with polling enabled to receive messages
const bot = new TelegramBot(token, { polling: true });

// Set up command handlers
bot.onText(/\/announce ([\s\S]+)/, async (msg, match) => {
  try {
    // Check if user is admin
    if (!ADMIN_IDS.includes(msg.from?.id || 0)) {
      await bot.sendMessage(msg.chat.id, '⛔ You are not authorized to use this command.');
      return;
    }
    
    // Extract the announcement text
    const announcementText = match ? match[1] : '';
    if (!announcementText) {
      await bot.sendMessage(msg.chat.id, '❌ Please provide an announcement text.');
      return;
    }
    
    // Send the announcement to the channel
    await bot.sendMessage(channelId, announcementText, { parse_mode: 'Markdown' });
    
    // Confirm to admin
    await bot.sendMessage(msg.chat.id, '✅ Announcement sent successfully!');
    logger.info(`Admin announcement sent by user ${msg.from?.id}`);
  } catch (error) {
    logger.error(`Failed to send admin announcement: ${error}`);
    await bot.sendMessage(msg.chat.id, `❌ Error sending announcement: ${error}`);
  }
});

// Video announcement command with RNotification.mp4
bot.onText(/\/announceWithVideo ([\s\S]+)/, async (msg, match) => {
  try {
    // Check if user is admin
    if (!ADMIN_IDS.includes(msg.from?.id || 0)) {
      await bot.sendMessage(msg.chat.id, '⛔ You are not authorized to use this command.');
      return;
    }
    
    // Extract the announcement text
    const announcementText = match ? match[1] : '';
    if (!announcementText) {
      await bot.sendMessage(msg.chat.id, '❌ Please provide an announcement text.');
      return;
    }
    
    // Path to the video
    const videoPath = path.join(__dirname, '../../assets/RNotification.mp4');
    
    // Check if video exists
    if (!fs.existsSync(videoPath)) {
      await bot.sendMessage(msg.chat.id, '❌ Video file not found!');
      return;
    }
    
    // Send the video announcement to the channel
    await bot.sendVideo(channelId, videoPath, {
      caption: announcementText,
      parse_mode: 'Markdown'
    });
    
    // Confirm to admin
    await bot.sendMessage(msg.chat.id, '✅ Video announcement sent successfully!');
    logger.info(`Admin video announcement sent by user ${msg.from?.id}`);
  } catch (error) {
    logger.error(`Failed to send admin video announcement: ${error}`);
    await bot.sendMessage(msg.chat.id, `❌ Error sending video announcement: ${error}`);
  }
});

// 7FTime video announcement command
bot.onText(/\/announceTime ([\s\S]+)/, async (msg, match) => {
  try {
    // Check if user is admin
    if (!ADMIN_IDS.includes(msg.from?.id || 0)) {
      await bot.sendMessage(msg.chat.id, '⛔ You are not authorized to use this command.');
      return;
    }
    
    // Extract the announcement text
    const announcementText = match ? match[1] : '';
    if (!announcementText) {
      await bot.sendMessage(msg.chat.id, '❌ Please provide an announcement text.');
      return;
    }
    
    // Path to the 7FTime video
    const videoPath = path.join(__dirname, '../../assets/7FTime.mp4');
    
    // Check if video exists
    if (!fs.existsSync(videoPath)) {
      await bot.sendMessage(msg.chat.id, '❌ 7FTime.mp4 file not found!');
      return;
    }
    
    // Send the video announcement to the channel
    await bot.sendVideo(channelId, videoPath, {
      caption: announcementText,
      parse_mode: 'Markdown'
    });
    
    // Confirm to admin
    await bot.sendMessage(msg.chat.id, '✅ 7FTime video announcement sent successfully!');
    logger.info(`Admin 7FTime video announcement sent by user ${msg.from?.id}`);
  } catch (error) {
    logger.error(`Failed to send admin 7FTime video announcement: ${error}`);
    await bot.sendMessage(msg.chat.id, `❌ Error sending 7FTime video announcement: ${error}`);
  }
});

// Help command
bot.onText(/\/help/, async (msg) => {
  try {
    // Check if user is admin
    const isAdmin = ADMIN_IDS.includes(msg.from?.id || 0);
    
    let helpText = '🤖 *7affle Bot Commands*\n\n';
    
    if (isAdmin) {
      helpText += '*Admin Commands:*\n'
      helpText += '`/announce [text]` - Send a text announcement to the channel\n'
      helpText += '`/announceWithVideo [text]` - Send a raffle notification video announcement\n'
      helpText += '`/announceTime [text]` - Send a 7F logo animation video announcement\n'
      helpText += '`/help` - Show this help message\n\n'
    }
    
    helpText += 'Visit 7affle.fun to participate in our raffles!';
    
    await bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error(`Failed to send help message: ${error}`);
  }
});

// Create a bot instance
// const bot = new TelegramBot(token, { polling: false });

// Send an announcement message to the configured channel
export const sendRaffleAnnouncement = async (
  raffleId: string,
  name: string,
  _description?: string,
  _ticketPrice?: number,
  _endTimestamp?: number
): Promise<void> => {
  try {
    // These calculations are no longer used in the message
    // but we'll keep the code in case we need to restore it later
    /* 
    // Format SOL amount (convert from lamports to SOL)
    const priceInSol = _ticketPrice ? _ticketPrice / 1_000_000_000 : 0;
    // Always show at least 1 decimal place, up to 3 for small amounts
    const formattedPrice = priceInSol < 0.01 ? priceInSol.toFixed(3) : 
                         priceInSol < 1 ? priceInSol.toFixed(2) :
                         priceInSol.toFixed(1);
    
    // Format end date
    const endDate = _endTimestamp ? new Date(_endTimestamp * 1000) : new Date();
    const formattedEndDate = endDate.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    */
    
    // Create message with emoji for better visibility in Telegram - enhanced for engagement
    const message = `
🔥 *NEW 7AFFLE ALERT!* 🔥

*${name}* 

*Raffle ID:* \`${raffleId}\`

💰 Win SOL in this exclusive raffle! 💰
🏆 Previous winners walked away with life-changing prizes! 🏆

⏰ *LIMITED TIME OPPORTUNITY* ⏰
🎯 Join now at 7affle.fun
🎮 Connect your wallet
🎟️ Get your tickets

🚀 *Don't miss your chance to win!* 🚀
`;

    // Send message to channel with markdown formatting
    await bot.sendMessage(channelId, message, { parse_mode: 'Markdown' });
    logger.info(`Announcement sent for new raffle: ${raffleId}`);
  } catch (error) {
    logger.error(`Failed to send announcement: ${error}`);
    throw error;
  }
};

// Send winner announcement to the configured channel
export const sendWinnerAnnouncement = async (
  raffleId: string,
  name: string,
  description: string,
  prizeAmount: number
): Promise<void> => {
  try {
    // Format SOL amount (convert from lamports to SOL)
    const prizeInSol = prizeAmount / 1_000_000_000;
    // Always show at least 1 decimal place, up to 3 for small amounts
    const formattedPrize = prizeInSol < 0.01 ? prizeInSol.toFixed(3) : 
                          prizeInSol < 1 ? prizeInSol.toFixed(2) :
                          prizeInSol.toFixed(1);
    
    // Create message with emoji for better visibility - enhanced winner announcement
    const message = `
🎁 *7AFFLE WINNER ANNOUNCEMENT!* 🎁

💸 *${formattedPrize} SOL CLAIMED!* 💸

*${name}* raffle has officially ended!

${description}

*Raffle ID:* \`${raffleId}\`

🎉 *CONGRATULATIONS TO OUR LUCKY WINNER!* 🎉

🔔 *NEXT RAFFLE COMING SOON* 🔔
📲 Stay tuned to this channel for more opportunities!
💎 Don't miss your next chance to win BIG at 7affle.fun

💰 *More prizes* • 🛩 *More winners* • 🎉 *More fun!*
`;

    // Send message to channel with markdown formatting
    await bot.sendMessage(channelId, message, { parse_mode: 'Markdown' });
    logger.info(`Winner announcement sent for raffle: ${raffleId}`);
  } catch (error) {
    logger.error(`Failed to send winner announcement: ${error}`);
    throw error;
  }
};

// Send a startup message when the bot begins monitoring
export const sendStartupMessage = async (): Promise<void> => {
  try {
    const message = `
🤖 *7affle Monitoring Bot Started*

The bot is now actively monitoring for new raffles on the Solana blockchain!
`;
    
    await bot.sendMessage(channelId, message, { parse_mode: 'Markdown' });
    logger.info('Startup message sent successfully');
  } catch (error) {
    logger.error(`Failed to send startup message: ${error}`);
    // Don't throw error here to prevent bot from crashing on startup
  }
};

// Send a raffle announcement with a video animation
export const sendRaffleAnnouncementWithVideo = async (
  raffleId: string,
  name: string,
  videoPath: string = path.join(__dirname, '../../assets/RNotification.mp4')
): Promise<void> => {
  try {
    // Verify the video file exists
    if (!fs.existsSync(videoPath)) {
      logger.error(`Video file not found at path: ${videoPath}`);
      // Fall back to regular announcement if video is missing
      return sendRaffleAnnouncement(raffleId, name);
    }

    // Create caption with emoji for better visibility in Telegram
    const caption = `
🔥 *NEW 7AFFLE ALERT!* 🔥

*${name}* 

*Raffle ID:* \`${raffleId}\`

💰 Win SOL in this exclusive raffle! 💰
🎯 Join now at 7affle.fun
🎟️ Get your tickets

🚀 *Don't miss your chance to win!* 🚀
`;

    // Send video with caption
    await bot.sendVideo(channelId, videoPath, {
      caption: caption,
      parse_mode: 'Markdown'
    });
    
    logger.info(`Video announcement sent for new raffle: ${raffleId}`);
  } catch (error) {
    logger.error(`Failed to send video announcement: ${error}`);
    // Fall back to regular announcement if video sending fails
    return sendRaffleAnnouncement(raffleId, name);
  }
};

export default bot;

import dotenv from 'dotenv';
import { monitorNewRaffles } from './services/raffle-monitor';
import { sendStartupMessage } from './utils/telegram';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Get polling interval from environment variables or use default value (1 minute)
const POLLING_INTERVAL_MS = parseInt(process.env.POLLING_INTERVAL_MS || '60000', 10);
const RETRY_DELAY_MS = parseInt(process.env.RETRY_DELAY_MS || '5000', 10);

// Start monitoring with polling
async function startMonitoring(): Promise<void> {
  try {
    // Log startup info
    logger.info('Starting 7affle Telegram Bot monitoring service');
    logger.info(`Polling interval: ${POLLING_INTERVAL_MS}ms`);
    logger.info(`Solana network: ${process.env.SOLANA_NETWORK || 'mainnet'}`);
    
    // Send startup message to Telegram channel
    await sendStartupMessage();
    
    // Run the monitoring function immediately on startup
    await monitorNewRaffles();
    
    // Then set up the polling interval
    setInterval(async () => {
      try {
        await monitorNewRaffles();
      } catch (error) {
        logger.error(`Error in monitoring cycle: ${error}`);
        // Continue with next polling cycle even if this one fails
      }
    }, POLLING_INTERVAL_MS);
    
    logger.info('Monitoring service started successfully');
  } catch (error) {
    logger.error(`Failed to start monitoring service: ${error}`);
    
    // Retry startup after a delay
    logger.info(`Retrying startup in ${RETRY_DELAY_MS}ms...`);
    setTimeout(startMonitoring, RETRY_DELAY_MS);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Service shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Service shutting down...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error}`);
  // Keep the service running even if there's an uncaught exception
});

// Start the monitoring service
startMonitoring();

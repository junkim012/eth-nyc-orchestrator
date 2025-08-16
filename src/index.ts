import app from './app';
import { EthereumService } from './services/EthereumService';
import logger from './utils/logger';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 3000;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

async function startServer() {
  try {
    // Validate required environment variables
    const requiredEnvVars = [
      'ETHEREUM_RPC_URL',
      'POCKETBASE_URL',
      'POCKETBASE_ADMIN_EMAIL',
      'POCKETBASE_ADMIN_PASSWORD',
      'USDC_ADDRESS',
      'PYUSD_ADDRESS',
      'ROUTER_ADDRESS'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    // Start the HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Orchestrator server started on port ${PORT}`);
    });

    // Start the Ethereum event listener
    const ethereumService = new EthereumService();
    await ethereumService.startListening();

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
      });

      await ethereumService.stopListening();
      
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
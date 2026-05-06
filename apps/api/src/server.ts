import app from './app';
import { config } from './config';
import { connectDB, disconnectDB } from './config/database';
import { connectRedis, redis } from './config/redis';
import { logger } from './utils/logger';
import { performDatabaseBackup } from './utils/backup';

async function bootstrap() {
  try {
    await connectDB();
    await connectRedis();
    
    // Note: Telegram Bot is initialized in utils/notifications.ts on import

    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`
╔═══════════════════════════════════════════╗
║          GDK Gym Management API           ║
║  Server running on port ${config.port}           ║
║  Environment: ${config.nodeEnv.padEnd(26)}║
║  API Base: /api/v1                        ║
╚═══════════════════════════════════════════╝
      `);
    });

    // ─── AUTOMATED BACKUPS ────────────────────────────────────────────────────
    // Run backup on startup and then every 24 hours
    performDatabaseBackup();
    setInterval(performDatabaseBackup, 24 * 60 * 60 * 1000);

    // ─── GRACEFUL SHUTDOWN ────────────────────────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        await redis.quit();
        logger.info('Server shut down cleanly');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 3) {
      logger.error('Redis max retries reached');
      return null;
    }
    return Math.min(times * 200, 1000);
  },
});

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error('Redis error:', err));

export async function connectRedis() {
  try {
    await redis.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed', error);
  }
}

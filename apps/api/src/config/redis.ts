import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

// Flag to track if Redis is actually working
export let isRedisConnected = false;

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 1, // Fail fast
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 1) {
      logger.warn('Redis unavailable, falling back to memory mode');
      return null; // Stop retrying
    }
    return 1000;
  },
});

redis.on('connect', () => {
  isRedisConnected = true;
  logger.info('✅ Redis connected');
});

redis.on('error', (err: any) => {
  isRedisConnected = false;
  // Be quiet in production if it's just a connection error
  if (config.isDev) {
    logger.error('Redis error:', err);
  } else if (err.code !== 'ECONNREFUSED') {
    logger.error('Redis error:', err);
  }
});

export async function connectRedis() {
  // If URL is default localhost and we are in production (like HF), don't even try
  if (config.redis.url.includes('localhost') && config.isProd) {
    logger.info('ℹ️ Skipping Redis connection on localhost in production');
    return;
  }

  try {
    await redis.connect();
  } catch (error) {
    isRedisConnected = false;
    logger.warn('⚠️ Redis connection failed - app will use in-memory fallbacks');
  }
}


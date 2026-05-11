import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { redis, isRedisConnected } from '../config/redis';
import { sendError, ErrorCodes } from '../utils/response';

// Redis Limiters
const redisRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl',
  points: 100,
  duration: 60,
  blockDuration: 60,
});

const redisAuthRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:auth',
  points: 10,
  duration: 60 * 15,
  blockDuration: 60 * 30,
});

// Memory Limiters (Fallbacks)
const memoryRateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

const memoryAuthRateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60 * 15,
});

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.user?.sub || req.ip || 'anonymous';
  const limiter = isRedisConnected ? redisRateLimiter : memoryRateLimiter;
  
  try {
    await limiter.consume(key);
    next();
  } catch {
    sendError(res, ErrorCodes.RATE_LIMITED, 'Too many requests. Please slow down.', 429);
  }
}

export async function authRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'anonymous';
  const limiter = isRedisConnected ? redisAuthRateLimiter : memoryAuthRateLimiter;
  
  try {
    await limiter.consume(key);
    next();
  } catch {
    sendError(res, ErrorCodes.RATE_LIMITED, 'Too many login attempts. Try again in 30 minutes.', 429);
  }
}


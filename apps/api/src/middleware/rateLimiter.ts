import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../config/redis';
import { sendError, ErrorCodes } from '../utils/response';

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl',
  points: 100,        // 100 requests
  duration: 60,       // per 60 seconds per user
  blockDuration: 60,  // block for 60s if exceeded
});

const authRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:auth',
  points: 10,         // 10 login attempts
  duration: 60 * 15,  // per 15 minutes
  blockDuration: 60 * 30, // block 30 min
});

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.user?.sub || req.ip || 'anonymous';
  try {
    await rateLimiter.consume(key);
    next();
  } catch {
    sendError(res, ErrorCodes.RATE_LIMITED, 'Too many requests. Please slow down.', 429);
  }
}

export async function authRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'anonymous';
  try {
    await authRateLimiter.consume(key);
    next();
  } catch {
    sendError(res, ErrorCodes.RATE_LIMITED, 'Too many login attempts. Try again in 30 minutes.', 429);
  }
}

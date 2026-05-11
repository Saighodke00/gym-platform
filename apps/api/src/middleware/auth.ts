import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { redis, isRedisConnected } from '../config/redis';
import { sendError, ErrorCodes } from '../utils/response';

// Memory fallback for refresh tokens if Redis is down
const memoryRefreshTokens = new Map<string, string>();

// Define UserRole type manually as it's a string in the Prisma schema
export type UserRole = 'admin' | 'trainer' | 'member';

export interface JwtPayload {
  sub: string;         // user id
  gymId: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return sendError(res, ErrorCodes.UNAUTHORIZED, 'Token expired', 401);
    }
    return sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid token', 401);
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, ErrorCodes.FORBIDDEN, 'Insufficient permissions', 403);
    }
    next();
  };
}

export function generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>) {
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(
    { sub: payload.sub },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
}


export async function storeRefreshToken(userId: string, token: string) {
  if (isRedisConnected) {
    await redis.setex(`refresh:${userId}`, 7 * 24 * 60 * 60, token);
  } else {
    memoryRefreshTokens.set(userId, token);
    // Cleanup old token after 7 days (primitive)
    setTimeout(() => memoryRefreshTokens.delete(userId), 7 * 24 * 60 * 60 * 1000);
  }
}

export async function invalidateRefreshToken(userId: string) {
  if (isRedisConnected) {
    await redis.del(`refresh:${userId}`);
  } else {
    memoryRefreshTokens.delete(userId);
  }
}

export async function validateRefreshToken(userId: string, token: string): Promise<boolean> {
  if (isRedisConnected) {
    const stored = await redis.get(`refresh:${userId}`);
    return stored === token;
  } else {
    const stored = memoryRefreshTokens.get(userId);
    return stored === token;
  }
}


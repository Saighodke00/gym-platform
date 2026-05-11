import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { validate } from '../middleware/validate';
import { authRateLimitMiddleware } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
  validateRefreshToken,
  UserRole,
} from '../middleware/auth';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

// POST /api/v1/auth/login
router.post('/login', authRateLimitMiddleware, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { gym: true },
  });

  if (!user || !user.is_active) {
    return sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid email or password', 401);
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash);
  if (!passwordValid) {
    return sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid email or password', 401);
  }

  const { accessToken, refreshToken } = generateTokens({
    sub: user.id,
    gymId: user.gym_id,
    role: user.role as UserRole,
    email: user.email,
  });

  await storeRefreshToken(user.id, refreshToken);
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  return sendSuccess(res, {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      gymId: user.gym_id,
      gymName: user.gym.name,
    },
  });
});

// POST /api/v1/auth/refresh
router.post('/refresh', validate(refreshSchema), async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { sub: string };
    const isValid = await validateRefreshToken(payload.sub, refreshToken);

    if (!isValid) {
      return sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.is_active) {
      return sendError(res, ErrorCodes.UNAUTHORIZED, 'User not found or inactive', 401);
    }

    const tokens = generateTokens({
      sub: user.id,
      gymId: user.gym_id,
      role: user.role as UserRole,
      email: user.email,
    });

    await storeRefreshToken(user.id, tokens.refreshToken);
    return sendSuccess(res, tokens);
  } catch {
    return sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid refresh token', 401);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  await invalidateRefreshToken(req.user!.sub);
  return sendSuccess(res, { message: 'Logged out successfully' });
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      phone: true, 
      role: true, 
      gym_id: true, 
      is_active: true, 
      last_login_at: true,
      gym: true 
    },
  });

  if (!user) return sendError(res, ErrorCodes.NOT_FOUND, 'User not found', 404);
  return sendSuccess(res, user);
});

export default router;

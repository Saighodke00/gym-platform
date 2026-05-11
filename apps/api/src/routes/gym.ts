import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { sendSuccess } from '../utils/response';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// ─── GET GYM PROFILE ──────────────────────────────────────────────────────────
router.get('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const gym = await prisma.gym.findFirst({
    where: { users: { some: { id: req.user!.sub } } }
  });

  if (!gym) {
    // Fallback to first gym for demo/local setup
    const firstGym = await prisma.gym.findFirst();
    return sendSuccess(res, firstGym);
  }

  return sendSuccess(res, gym);
}));

// ─── UPDATE GYM PROFILE ───────────────────────────────────────────────────────
router.patch('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const gym = await prisma.gym.findFirst({
    where: { users: { some: { id: req.user!.sub } } }
  });

  if (!gym) {
    return res.status(404).json({ success: false, error: { message: 'Gym not found' } });
  }

  const updatedGym = await prisma.gym.update({
    where: { id: gym.id },
    data: req.body,
  });

  return sendSuccess(res, updatedGym);
}));

export default router;

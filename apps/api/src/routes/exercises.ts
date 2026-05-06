import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/v1/exercises
router.get('/', async (req, res) => {
  const gymId = req.user!.gymId;
  const exercises = await prisma.exercise.findMany({
    where: { gym_id: gymId, is_active: true },
    orderBy: { name: 'asc' }
  });
  return sendSuccess(res, exercises);
});

// POST /api/v1/exercises
router.post('/', authorize('admin', 'trainer'), async (req, res) => {
  const gymId = req.user!.gymId;
  const { name, muscle_groups, equipment, default_sets, default_reps, rest_seconds, video_url } = req.body;

  const exercise = await prisma.exercise.create({
    data: {
      gym_id: gymId,
      name,
      muscle_groups,
      equipment,
      default_sets: parseInt(default_sets) || 3,
      default_reps: parseInt(default_reps) || 12,
      rest_seconds: parseInt(rest_seconds) || 60,
      video_url
    }
  });

  return sendSuccess(res, exercise, 201);
});

export default router;

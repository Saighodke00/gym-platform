import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/v1/workouts/templates
router.get('/templates', async (req, res) => {
  const gymId = req.user!.gymId;
  const templates = await prisma.workoutPlan.findMany({
    where: { gym_id: gymId, is_template: true },
    include: { days: true },
    orderBy: { created_at: 'desc' }
  });
  return sendSuccess(res, templates);
});

// POST /api/v1/workouts/templates
router.post('/templates', authorize('admin', 'trainer'), async (req, res) => {
  const gymId = req.user!.gymId;
  const userId = req.user!.sub;
  const { name, level, goal, duration_weeks, days_per_week, description, days } = req.body;

  const template = await prisma.workoutPlan.create({
    data: {
      gym_id: gymId,
      name,
      level,
      goal,
      duration_weeks: parseInt(duration_weeks),
      days_per_week: parseInt(days_per_week),
      description,
      is_template: true,
      created_by: userId,
      days: {
        create: (days || []).map((day: any) => ({
          week_num: 1,
          day_num: day.day_num,
          muscle_focus: day.muscle_focus,
          exercises: JSON.stringify(day.exercises)
        }))
      }
    },
    include: { days: true }
  });

  return sendSuccess(res, template, 201);
});

// GET /api/v1/workouts/member/:id
router.get('/member/:id', async (req, res) => {
  const memberId = req.params.id;
  const plan = await prisma.workoutPlan.findFirst({
    where: { 
      sessions: { some: { member_id: memberId } },
      is_template: false
    },
    include: { days: true, sessions: { orderBy: { session_date: 'desc' }, take: 10 } },
    orderBy: { created_at: 'desc' }
  });
  return sendSuccess(res, plan);
});

export default router;

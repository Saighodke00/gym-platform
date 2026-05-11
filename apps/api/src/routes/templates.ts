import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/response';

const router = Router();

const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().optional().nullable(),
  content: z.string().min(1),
  type: z.string().min(1),
});

router.use(authenticate);

// GET /api/v1/templates
router.get('/', async (req, res) => {
  const templates = await prisma.messageTemplate.findMany({
    where: { gym_id: req.user!.gymId },
    orderBy: { updated_at: 'desc' },
  });
  return sendSuccess(res, templates);
});

// POST /api/v1/templates
router.post('/', validate(templateSchema), async (req, res) => {
  const template = await prisma.messageTemplate.create({
    data: {
      ...req.body,
      gym_id: req.user!.gymId,
    },
  });
  return sendSuccess(res, template, 201);
});

// PATCH /api/v1/templates/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const template = await prisma.messageTemplate.update({
    where: { id, gym_id: req.user!.gymId },
    data: req.body,
  });
  return sendSuccess(res, template);
});

// DELETE /api/v1/templates/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.messageTemplate.delete({
    where: { id, gym_id: req.user!.gymId },
  });
  return sendSuccess(res, null, 204);
});

export default router;

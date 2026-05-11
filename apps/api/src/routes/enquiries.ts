import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response';

const router = Router();

const enquirySchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional().nullable(),
  source: z.string().optional().nullable(),
  interested_in: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  follow_up_date: z.string().optional().nullable(),
});

router.use(authenticate);

// GET /api/v1/enquiries
router.get('/', async (req, res) => {
  const enquiries = await prisma.enquiry.findMany({
    where: { gym_id: req.user!.gymId },
    orderBy: { created_at: 'desc' },
  });
  return sendSuccess(res, enquiries);
});

// POST /api/v1/enquiries
router.post('/', validate(enquirySchema), async (req, res) => {
  const enquiry = await prisma.enquiry.create({
    data: {
      ...req.body,
      gym_id: req.user!.gymId,
      follow_up_date: req.body.follow_up_date ? new Date(req.body.follow_up_date) : null,
    },
  });
  return sendSuccess(res, enquiry, 201);
});

// PATCH /api/v1/enquiries/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const enquiry = await prisma.enquiry.update({
    where: { id, gym_id: req.user!.gymId },
    data: {
      ...req.body,
      follow_up_date: req.body.follow_up_date ? new Date(req.body.follow_up_date) : undefined,
    },
  });
  return sendSuccess(res, enquiry);
});

// DELETE /api/v1/enquiries/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.enquiry.delete({
    where: { id, gym_id: req.user!.gymId },
  });
  return sendSuccess(res, null, 204);
});

export default router;

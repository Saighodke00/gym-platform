import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/response';

const router = Router();

const expenseSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional().nullable(),
  expense_date: z.string().optional().nullable(),
});

router.use(authenticate);
router.use(authorize('admin')); // Only admins can manage expenses

// GET /api/v1/expenses
router.get('/', async (req, res) => {
  const expenses = await prisma.expense.findMany({
    where: { gym_id: req.user!.gymId },
    orderBy: { expense_date: 'desc' },
  });
  return sendSuccess(res, expenses);
});

// POST /api/v1/expenses
router.post('/', validate(expenseSchema), async (req, res) => {
  const expense = await prisma.expense.create({
    data: {
      ...req.body,
      gym_id: req.user!.gymId,
      expense_date: req.body.expense_date ? new Date(req.body.expense_date) : new Date(),
    },
  });
  return sendSuccess(res, expense, 201);
});

// DELETE /api/v1/expenses/:id
router.delete('/:id', async (req, res) => {
  await prisma.expense.delete({
    where: { id, gym_id: req.user!.gymId },
  });
  return sendSuccess(res, null, 204);
});

export default router;

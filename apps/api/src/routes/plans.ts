import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimitMiddleware } from '../middleware/rateLimiter';
import { auditLog } from '../middleware/audit';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response';
import { sendNotification, getRenewalMessage } from '../utils/notifications';

const router = Router();
router.use(authenticate, rateLimitMiddleware);

const planSchema = z.object({
  name: z.string().min(2, 'Plan name required'),
  description: z.string().optional(),
  duration_days: z.number().int().positive('Duration must be positive'),
  price: z.number().positive('Price must be positive'),
  gst_rate: z.number().min(0).max(28).default(18),
  gst_inclusive: z.boolean().default(false),
  features: z.array(z.string()).default([]),
  max_members: z.number().int().positive().optional(),
  freeze_days_allowed: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

const assignPlanSchema = z.object({
  member_id: z.string(),
  plan_id: z.string(),
  start_date: z.string(),
  discount_applied: z.number().min(0).default(0),
  coupon_code: z.string().optional(),
  notes: z.string().optional(),
  amount_paid: z.number().positive(),
});

// GET /api/v1/plans
router.get('/', async (req, res) => {
  const plans = await prisma.membershipPlan.findMany({
    where: { gym_id: req.user!.gymId },
    include: {
      _count: { select: { member_plans: { where: { status: 'active' } } } },
    },
    orderBy: { created_at: 'desc' },
  });
  return sendSuccess(res, plans);
});

// GET /api/v1/plans/:id
router.get('/:id', async (req, res) => {
  const plan = await prisma.membershipPlan.findFirst({
    where: { id: req.params.id, gym_id: req.user!.gymId },
    include: {
      member_plans: {
        where: { status: 'active' },
        include: { member: { include: { user: { select: { name: true } } } } },
        take: 20,
      },
      _count: { select: { member_plans: { where: { status: 'active' } } } },
    },
  });
  if (!plan) return sendError(res, ErrorCodes.NOT_FOUND, 'Plan not found', 404);
  return sendSuccess(res, plan);
});

// POST /api/v1/plans
router.post('/', authorize('admin'), validate(planSchema), async (req, res) => {
  const plan = await prisma.membershipPlan.create({
    data: { ...req.body, gym_id: req.user!.gymId },
  });
  await auditLog(req, 'CREATE_PLAN', 'membership_plan', plan.id, null, plan);
  return sendSuccess(res, plan, 201);
});

// PUT /api/v1/plans/:id
router.put('/:id', authorize('admin'), validate(planSchema.partial()), async (req, res) => {
  const existing = await prisma.membershipPlan.findFirst({
    where: { id: req.params.id, gym_id: req.user!.gymId },
  });
  if (!existing) return sendError(res, ErrorCodes.NOT_FOUND, 'Plan not found', 404);

  const updated = await prisma.membershipPlan.update({
    where: { id: req.params.id },
    data: req.body,
  });
  await auditLog(req, 'UPDATE_PLAN', 'membership_plan', req.params.id, existing, updated);
  return sendSuccess(res, updated);
});

// PATCH /api/v1/plans/:id/toggle-active
router.patch('/:id/toggle-active', authorize('admin'), async (req, res) => {
  const plan = await prisma.membershipPlan.findFirst({
    where: { id: req.params.id, gym_id: req.user!.gymId },
  });
  if (!plan) return sendError(res, ErrorCodes.NOT_FOUND, 'Plan not found', 404);

  const updated = await prisma.membershipPlan.update({
    where: { id: req.params.id },
    data: { is_active: !plan.is_active },
  });
  return sendSuccess(res, updated);
});

// POST /api/v1/plans/assign
router.post('/assign', authorize('admin', 'trainer'), validate(assignPlanSchema), async (req, res) => {
  const { member_id, plan_id, start_date, discount_applied, coupon_code, notes, amount_paid } = req.body;

  const [member, plan] = await Promise.all([
    prisma.member.findFirst({ 
      where: { id: member_id, gym_id: req.user!.gymId },
      include: { user: true }
    }),
    prisma.membershipPlan.findFirst({ where: { id: plan_id, gym_id: req.user!.gymId, is_active: true } }),
  ]);

  if (!member) return sendError(res, ErrorCodes.NOT_FOUND, 'Member not found', 404);
  if (!plan) return sendError(res, ErrorCodes.NOT_FOUND, 'Plan not found or inactive', 404);

  const startDate = new Date(start_date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.duration_days);

  const memberPlan = await prisma.$transaction(async (tx) => {
    // Expire any existing active plan
    await tx.memberPlan.updateMany({
      where: { member_id, status: 'active' },
      data: { status: 'expired' },
    });

    const mp = await tx.memberPlan.create({
      data: {
        member_id,
        plan_id,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        amount_paid,
        discount_applied,
        coupon_code,
        notes,
      },
      include: { plan: true },
    });

    await tx.member.update({
      where: { id: member_id },
      data: { status: 'active' },
    });

    await tx.timelineEvent.create({
      data: {
        member_id,
        event_type: 'plan_assigned',
        description: `Plan assigned: ${plan.name} (valid till ${endDate.toLocaleDateString('en-IN')})`,
        metadata: JSON.stringify({ plan_id, plan_name: plan.name, end_date: endDate }),
      },
    });

    return mp;
  });

  await auditLog(req, 'ASSIGN_PLAN', 'member_plan', memberPlan.id, null, memberPlan);
  // Send Renewal Notification (Telegram/Email)
  if (member.user.email) {
    sendNotification({
      email: member.user.email,
      subject: 'Membership Renewal Confirmation',
      message: getRenewalMessage(member.user.name, plan.name, endDate),
      channel: 'email'
    }).catch(err => console.error('Failed to send renewal email:', err));
  }

  return sendSuccess(res, memberPlan, 201);
});

export default router;

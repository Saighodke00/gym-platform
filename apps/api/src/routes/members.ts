import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import QRCode from 'qrcode';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimitMiddleware } from '../middleware/rateLimiter';
import { auditLog } from '../middleware/audit';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response';
import { generateMemberCode } from '../utils/memberUtils';
import { sendNotification, getWelcomeMessage } from '../utils/notifications';

const router = Router();
router.use(authenticate, rateLimitMiddleware);

// ─── SCHEMAS ─────────────────────────────────────────────────────────────────

const createMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  dob: z.string().optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  height_cm: z.preprocess((val) => (val === '' ? undefined : val), z.number().positive().optional()),
  weight_kg: z.preprocess((val) => (val === '' ? undefined : val), z.number().positive().optional()),
  body_fat_pct: z.preprocess((val) => (val === '' ? undefined : val), z.number().min(0).max(100).optional()),
  medical_conditions: z.string().optional(),
  fitness_goal: z.string().optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  dietary_preference: z.string().optional(),
  fitness_experience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  referral_source: z.string().optional(),
  trainer_id: z.string().optional(),
});

const updateMemberSchema = createMemberSchema.partial();

const querySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'expiring_soon', 'expired', 'archived']).optional(),
  trainer_id: z.string().optional(),
  plan_id: z.string().optional(),
  fitness_goal: z.string().optional(),
  sort_by: z.enum(['name', 'joined_at', 'end_date', 'last_checkin']).optional().default('joined_at'),
  sort_dir: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// ─── LIST MEMBERS ─────────────────────────────────────────────────────────────

router.get('/', validate(querySchema, 'query'), async (req, res) => {
  const { search, status, trainer_id, plan_id, fitness_goal, sort_by, sort_dir, page, limit } = req.query as any;

  const where: any = { gym_id: req.user!.gymId };

  // Trainer can only see their assigned members
  if (req.user!.role === 'trainer') {
    where.trainer_relations = { some: { trainer_id: req.user!.sub } };
  } else if (trainer_id) {
    where.trainer_relations = { some: { trainer_id } };
  }

  if (status) where.status = status;
  if (fitness_goal) where.fitness_goal = fitness_goal;
  if (plan_id) {
    where.member_plans = { some: { plan_id, status: 'active' } };
  }

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { phone: { contains: search } } },
      { member_code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy: any = {};
  if (sort_by === 'name') orderBy.user = { name: sort_dir };
  else if (sort_by === 'joined_at') orderBy.joined_at = sort_dir;
  else orderBy.joined_at = 'desc';

  const skip = (page - 1) * limit;

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        member_plans: {
          where: { status: 'active' },
          include: { plan: { select: { name: true, duration_days: true, price: true } } },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        trainer_relations: {
          include: { trainer: { select: { id: true, name: true } } },
        },
        attendance: {
          orderBy: { checked_in_at: 'desc' },
          take: 1,
          select: { checked_in_at: true },
        },
      },
    }),
    prisma.member.count({ where }),
  ]);

  return sendSuccess(res, members, 200, {
    page,
    limit,
    total,
    hasMore: skip + members.length < total,
  });
});

// ─── GET SINGLE MEMBER ────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  const member = await prisma.member.findFirst({
    where: { id: req.params.id, gym_id: req.user!.gymId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, role: true, is_active: true } },
      member_plans: {
        include: { plan: true },
        orderBy: { created_at: 'desc' },
      },
      trainer_relations: {
        include: { trainer: { select: { id: true, name: true, email: true } } },
      },
      attendance: {
        orderBy: { checked_in_at: 'desc' },
        take: 30,
      },
      progress_logs: {
        orderBy: { logged_at: 'desc' },
        take: 10,
      },
      documents: true,
      timeline_events: {
        orderBy: { created_at: 'desc' },
        take: 20,
      },
    },
  });

  if (!member) return sendError(res, ErrorCodes.NOT_FOUND, 'Member not found', 404);
  return sendSuccess(res, member);
});

// ─── CREATE MEMBER ────────────────────────────────────────────────────────────

router.post('/', authorize('admin', 'trainer'), validate(createMemberSchema), async (req, res) => {
  const { name, email, phone, trainer_id, dob, ...memberFields } = req.body;

  // Check email uniqueness
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return sendError(res, ErrorCodes.CONFLICT, 'A user with this email already exists', 409);
  }

  const memberCode = await generateMemberCode(req.user!.gymId);
  const defaultPassword = `GDK@${phone.slice(-4)}`;
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        gym_id: req.user!.gymId,
        name,
        email,
        phone,
        role: 'member',
        password_hash: passwordHash,
      },
    });

    const member = await tx.member.create({
      data: {
        gym_id: req.user!.gymId,
        user_id: user.id,
        member_code: memberCode,
        dob: dob ? new Date(dob) : undefined,
        ...memberFields,
      },
    });

    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(`GDK:${memberCode}`, {
      width: 300,
      margin: 2,
      color: { dark: '#1A56A0', light: '#FFFFFF' },
    });
    await tx.member.update({ where: { id: member.id }, data: { qr_code_url: qrDataUrl } });

    // Assign trainer if provided
    if (trainer_id) {
      await tx.trainerMember.create({ data: { trainer_id, member_id: member.id } });
    }

    // Create timeline event
    await tx.timelineEvent.create({
      data: {
        member_id: member.id,
        event_type: 'joined',
        description: `${name} joined GDK Gym`,
        metadata: JSON.stringify({ member_code: memberCode }),
      },
    });

    return { ...member, user, defaultPassword };
  }).catch(err => {
    console.error('❌ [Member Creation] Transaction Failed:', err);
    throw err;
  });

  await auditLog(req, 'CREATE_MEMBER', 'member', result.id, null, { member_code: memberCode });

  // 6. Send Welcome Notification (Telegram/Email)
  if (email) {
    sendNotification({
      email,
      subject: `Welcome to ${req.user?.gymName || 'GDK Gym'}!`,
      message: getWelcomeMessage(name, memberCode),
      channel: 'email'
    }).catch(err => console.error('Failed to send welcome email:', err));
  }

  return sendSuccess(res, result, 201);
});

// ─── UPDATE MEMBER ────────────────────────────────────────────────────────────

router.put('/:id', authorize('admin', 'trainer'), validate(updateMemberSchema), async (req, res) => {
  const { name, email, phone, trainer_id, dob, ...memberFields } = req.body;

  const existing = await prisma.member.findFirst({
    where: { id: req.params.id, gym_id: req.user!.gymId },
    include: { user: true },
  });
  if (!existing) return sendError(res, ErrorCodes.NOT_FOUND, 'Member not found', 404);

  const updated = await prisma.$transaction(async (tx) => {
    if (name || email || phone) {
      await tx.user.update({
        where: { id: existing.user_id },
        data: { ...(name && { name }), ...(email && { email }), ...(phone && { phone }) },
      });
    }

    const member = await tx.member.update({
      where: { id: req.params.id },
      data: { ...memberFields, ...(dob && { dob: new Date(dob) }) },
      include: { user: { select: { id: true, name: true, email: true, phone: true, role: true, is_active: true } } },
    });

    await tx.timelineEvent.create({
      data: {
        member_id: req.params.id,
        event_type: 'profile_updated',
        description: 'Member profile updated',
      },
    });

    return member;
  });

  await auditLog(req, 'UPDATE_MEMBER', 'member', req.params.id, existing, updated);
  return sendSuccess(res, updated);
});

// ─── DELETE MEMBER ────────────────────────────────────────────────────────────
// Permanently removes a member and their associated user account
router.delete('/:id', authorize('admin'), async (req, res) => {
  const member = await prisma.member.findFirst({
    where: { id: req.params.id, gym_id: req.user!.gymId },
  });

  if (!member) {
    return sendError(res, ErrorCodes.NOT_FOUND, 'Member not found', 404);
  }

  await prisma.$transaction(async (tx) => {
    // 1. Delete all relational data
    await tx.attendance.deleteMany({ where: { member_id: member.id } });
    await tx.memberPlan.deleteMany({ where: { member_id: member.id } });
    await tx.progressLog.deleteMany({ where: { member_id: member.id } });
    await tx.timelineEvent.deleteMany({ where: { member_id: member.id } });
    await tx.trainerMember.deleteMany({ where: { member_id: member.id } });
    await tx.memberDocument.deleteMany({ where: { member_id: member.id } });
    await tx.feedback.deleteMany({ where: { member_id: member.id } });
    await tx.notification.deleteMany({ where: { member_id: member.id } });
    await tx.payment.deleteMany({ where: { member_id: member.id } });
    await tx.memberWorkoutSession.deleteMany({ where: { member_id: member.id } });
    await tx.sessionNote.deleteMany({ where: { member_id: member.id } });

    // 2. Delete member record
    await tx.member.delete({ where: { id: member.id } });

    // 3. Delete associated user account
    await tx.user.delete({ where: { id: member.user_id } });
  });

  await auditLog(req, 'DELETE_MEMBER', 'member', req.params.id, member, null);
  return sendSuccess(res, { message: 'Member and associated user deleted successfully' });
});

// ─── ARCHIVE MEMBER ───────────────────────────────────────────────────────────

router.patch('/:id/archive', authorize('admin'), async (req, res) => {
  const member = await prisma.member.findFirst({
    where: { id: req.params.id, gym_id: req.user!.gymId },
  });
  if (!member) return sendError(res, ErrorCodes.NOT_FOUND, 'Member not found', 404);

  const updated = await prisma.member.update({
    where: { id: req.params.id },
    data: { status: 'archived' },
  });

  await prisma.timelineEvent.create({
    data: {
      member_id: req.params.id,
      event_type: 'archived',
      description: 'Member account archived',
    },
  });

  await auditLog(req, 'ARCHIVE_MEMBER', 'member', req.params.id);
  return sendSuccess(res, updated);
});

// ─── BULK OPERATIONS ──────────────────────────────────────────────────────────

router.post('/bulk-action', authorize('admin'), async (req, res) => {
  const schema = z.object({
    member_ids: z.array(z.string().uuid()).min(1).max(100),
    action: z.enum(['archive', 'send_notification', 'export', 'change_status']),
    payload: z.record(z.unknown()).optional(),
  });
  const { member_ids, action, payload } = schema.parse(req.body);

  const members = await prisma.member.findMany({
    where: { id: { in: member_ids }, gym_id: req.user!.gymId },
    include: { user: { select: { name: true, phone: true } } },
  });

  if (action === 'archive') {
    await prisma.member.updateMany({
      where: { id: { in: member_ids } },
      data: { status: 'archived' },
    });
    return sendSuccess(res, { affected: members.length, message: `${members.length} members archived` });
  }

  if (action === 'change_status') {
    const status = (payload as any)?.status;
    await prisma.member.updateMany({
      where: { id: { in: member_ids } },
      data: { status },
    });
    return sendSuccess(res, { affected: members.length });
  }

  return sendSuccess(res, { members, action, payload });
});

// ─── MEMBER STATS ─────────────────────────────────────────────────────────────

router.get('/:id/stats', async (req, res) => {
  const memberId = req.params.id;

  const [attendanceCount, currentPlan, progressLogs] = await Promise.all([
    prisma.attendance.count({
      where: {
        member_id: memberId,
        checked_in_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.memberPlan.findFirst({
      where: { member_id: memberId, status: 'active' },
      include: { plan: true },
      orderBy: { created_at: 'desc' },
    }),
    prisma.progressLog.findMany({
      where: { member_id: memberId },
      orderBy: { logged_at: 'desc' },
      take: 5,
    }),
  ]);

  return sendSuccess(res, {
    attendance_last_30_days: attendanceCount,
    current_plan: currentPlan,
    recent_progress: progressLogs,
  });
});

export default router;

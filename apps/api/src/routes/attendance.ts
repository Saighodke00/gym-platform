import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimitMiddleware } from '../middleware/rateLimiter';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response';
import { sendNotification, getCheckInMessage } from '../utils/notifications';

const router = Router();

const qrCheckInSchema = z.object({
  member_code: z.string().min(1, 'Member code required'),
});

const manualCheckInSchema = z.object({
  member_id: z.string().uuid(),
  notes: z.string().optional(),
});

// ─── PUBLIC ROUTES (No Auth Required) ──────────────────────────────────────────

// POST /api/v1/attendance/public-checkin
router.post('/public-checkin', rateLimitMiddleware, validate(qrCheckInSchema), async (req, res) => {
  const { member_code } = req.body;

  const member = await prisma.member.findUnique({
    where: { member_code },
    include: {
      user: { select: { name: true, email: true } },
      gym: { select: { id: true, name: true } },
      member_plans: {
        where: { status: 'active' },
        include: { plan: { select: { name: true } } },
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  });

  if (!member) {
    return sendError(res, ErrorCodes.NOT_FOUND, 'Member not found. Please check your ID.', 404);
  }

  const activePlan = member.member_plans[0];
  const now = new Date();

  // 1. Check membership validity
  if (!activePlan || activePlan.end_date < now) {
    const daysOverdue = activePlan
      ? Math.ceil((now.getTime() - activePlan.end_date.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return res.status(200).json({
      success: true,
      data: {
        status: 'expired',
        member: { name: member.user.name, member_code: member.member_code },
        message: daysOverdue
          ? `Membership expired ${daysOverdue} days ago.`
          : 'No active membership found.',
      },
    });
  }

  // 2. Check for duplicate check-in today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const alreadyCheckedIn = await prisma.attendance.findFirst({
    where: { member_id: member.id, checked_in_at: { gte: todayStart } },
  });

  if (alreadyCheckedIn) {
    return res.status(200).json({
      success: true,
      data: {
        status: 'already_checked_in',
        member: { name: member.user.name, member_code: member.member_code },
        message: 'You already checked in today! 💪',
      },
    });
  }

  // 3. Mark attendance
  const attendance = await prisma.attendance.create({
    data: {
      member_id: member.id,
      gym_id: member.gym_id,
      method: 'qr',
    },
  });

  // 4. Send Check-in Notification
  // Quick streak calc: count attendance in last 30 days as an approximation for motivation
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentVisits = await prisma.attendance.count({
    where: { member_id: member.id, checked_in_at: { gte: thirtyDaysAgo } }
  });
  
  sendNotification({
    email: member.user.email || undefined,
    telegramChatId: process.env.TELEGRAM_ADMIN_CHAT_ID, // Send to Admin Telegram
    subject: 'GDK Gym: Check-in Successful ✅',
    message: getCheckInMessage(member.user.name, attendance.checked_in_at, recentVisits),
    channel: 'both'
  }).catch(err => console.error('Failed to send checkin notification:', err));

  return res.status(201).json({
    success: true,
    data: {
      status: 'success',
      member: {
        name: member.user.name,
        member_code: member.member_code,
        plan_name: activePlan.plan.name,
      },
      message: `Welcome to ${member.gym.name}, ${member.user.name}! ✅`,
    },
  });
});

// ─── PROTECTED ROUTES ─────────────────────────────────────────────────────────
router.use(authenticate);
router.use(rateLimitMiddleware);


// POST /api/v1/attendance/qr-checkin
router.post('/qr-checkin', validate(qrCheckInSchema), async (req, res) => {
  const { member_code } = req.body;

  const member = await prisma.member.findFirst({
    where: { member_code, gym_id: req.user!.gymId },
    include: {
      user: { select: { name: true, email: true } },
      member_plans: {
        where: { status: 'active' },
        include: { plan: { select: { name: true } } },
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  });

  if (!member) {
    return sendError(res, ErrorCodes.NOT_FOUND, 'Member not found', 404);
  }

  const activePlan = member.member_plans[0];
  const now = new Date();

  if (!activePlan || activePlan.end_date < now) {
    const daysOverdue = activePlan
      ? Math.ceil((now.getTime() - activePlan.end_date.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return res.status(200).json({
      success: true,
      data: {
        status: 'expired',
        member: { name: member.user.name, member_code: member.member_code },
        message: daysOverdue
          ? `Membership expired ${daysOverdue} days ago. Please renew.`
          : 'No active membership. Please contact the front desk.',
        days_overdue: daysOverdue,
      },
    });
  }

  // Check for duplicate check-in (already checked in today)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const alreadyCheckedIn = await prisma.attendance.findFirst({
    where: { member_id: member.id, checked_in_at: { gte: todayStart } },
  });

  if (alreadyCheckedIn) {
    return res.status(200).json({
      success: true,
      data: {
        status: 'already_checked_in',
        member: { name: member.user.name, member_code: member.member_code },
        checked_in_at: alreadyCheckedIn.checked_in_at,
        message: `${member.user.name} already checked in today at ${alreadyCheckedIn.checked_in_at.toLocaleTimeString('en-IN')}`,
      },
    });
  }

  const attendance = await prisma.attendance.create({
    data: {
      member_id: member.id,
      gym_id: req.user!.gymId,
      method: 'qr',
    },
  });

  // Send Check-in Notification
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentVisits = await prisma.attendance.count({
    where: { member_id: member.id, checked_in_at: { gte: thirtyDaysAgo } }
  });
  
  sendNotification({
    email: member.user.email || undefined,
    telegramChatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
    subject: 'GDK Gym: Check-in Successful ✅',
    message: getCheckInMessage(member.user.name, attendance.checked_in_at, recentVisits),
    channel: 'both'
  }).catch(err => console.error('Failed to send checkin notification:', err));

  return res.status(201).json({
    success: true,
    data: {
      status: 'success',
      member: {
        name: member.user.name,
        member_code: member.member_code,
        plan_name: activePlan.plan.name,
        plan_expires: activePlan.end_date,
      },
      checked_in_at: attendance.checked_in_at,
      message: `Welcome back, ${member.user.name}! ✅`,
    },
  });
});

// POST /api/v1/attendance/manual-checkin
router.post('/manual-checkin', authorize('admin', 'trainer'), validate(manualCheckInSchema), async (req, res) => {
  const { member_id, notes } = req.body;

  const member = await prisma.member.findFirst({
    where: { id: member_id, gym_id: req.user!.gymId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!member) return sendError(res, ErrorCodes.NOT_FOUND, 'Member not found', 404);

  const attendance = await prisma.attendance.create({
    data: {
      member_id,
      gym_id: req.user!.gymId,
      method: 'manual',
      notes,
    },
  });

  // Send Check-in Notification
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentVisits = await prisma.attendance.count({
    where: { member_id: member.id, checked_in_at: { gte: thirtyDaysAgo } }
  });
  
  sendNotification({
    email: member.user.email || undefined,
    telegramChatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
    subject: 'GDK Gym: Check-in Successful ✅',
    message: getCheckInMessage(member.user.name, attendance.checked_in_at, recentVisits),
    channel: 'both'
  }).catch(err => console.error('Failed to send manual checkin notification:', err));

  return sendSuccess(res, {
    ...attendance,
    member_name: member.user.name,
    note: 'Manually logged — flagged as Manual in attendance report',
  }, 201);
});

// GET /api/v1/attendance/today
router.get('/today', async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const checkins = await prisma.attendance.findMany({
    where: {
      gym_id: req.user!.gymId,
      checked_in_at: { gte: todayStart },
    },
    include: {
      member: {
        include: {
          user: { select: { name: true } },
          member_plans: {
            where: { status: 'active' },
            include: { plan: { select: { name: true } } },
            take: 1,
          },
        },
      },
    },
    orderBy: { checked_in_at: 'desc' },
  });

  return sendSuccess(res, {
    date: todayStart.toISOString().split('T')[0],
    total_checkins: checkins.length,
    checkins,
  });
});

// GET /api/v1/attendance/member/:memberId
router.get('/member/:memberId', async (req, res) => {
  const { memberId } = req.params;
  const { start_date, end_date } = req.query;

  const where: any = { member_id: memberId, gym_id: req.user!.gymId };
  if (start_date) where.checked_in_at = { ...(where.checked_in_at || {}), gte: new Date(start_date as string) };
  if (end_date) where.checked_in_at = { ...(where.checked_in_at || {}), lte: new Date(end_date as string) };

  const attendance = await prisma.attendance.findMany({
    where,
    orderBy: { checked_in_at: 'desc' },
  });

  // Calculate streak
  const dates = attendance.map(a => new Date(a.checked_in_at.toDateString()));
  const uniqueDates = [...new Set(dates.map(d => d.toISOString()))].map(d => new Date(d as string)).sort((a, b) => b.getTime() - a.getTime());
  
  let streak = 0;
  if (uniqueDates.length) {
    streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const diff = (uniqueDates[i].getTime() - uniqueDates[i + 1].getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else break;
    }
  }

  return sendSuccess(res, {
    total: attendance.length,
    streak,
    attendance,
  });
});

// GET /api/v1/attendance/stats
router.get('/stats', authorize('admin'), async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayCount, monthCount, hourlyData] = await Promise.all([
    prisma.attendance.count({ where: { gym_id: req.user!.gymId, checked_in_at: { gte: todayStart } } }),
    prisma.attendance.count({ where: { gym_id: req.user!.gymId, checked_in_at: { gte: thirtyDaysAgo } } }),
    prisma.attendance.findMany({
      where: { gym_id: req.user!.gymId, checked_in_at: { gte: thirtyDaysAgo } },
      select: { checked_in_at: true },
    }),
  ]);

  // Build hourly heatmap
  const hourlyMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourlyMap[h] = 0;
  hourlyData.forEach(a => {
    const hour = a.checked_in_at.getHours();
    hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
  });

  return sendSuccess(res, {
    today: todayCount,
    last_30_days: monthCount,
    avg_per_day: Math.round(monthCount / 30),
    hourly_heatmap: hourlyMap,
  });
});

export default router;

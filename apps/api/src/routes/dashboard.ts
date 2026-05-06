import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimiter';
import { sendSuccess } from '../utils/response';

const router = Router();
router.use(authenticate, authorize('admin'), rateLimitMiddleware);

// GET /api/v1/dashboard/stats
router.get('/stats', async (req, res) => {
  const gymId = req.user!.gymId;
  const now = new Date();

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalActive,
    newThisMonth,
    expiredThisMonth,
    todayCheckins,
    expiringSoon,
    revenueThisMonth,
    revenueLastMonth,
    overdueMembers,
    upcomingRenewals,
    recentMembers,
    dailyCheckins,
    planDistribution,
    todaysCheckinsList,
    topMembers,
  ] = await Promise.all([
    // Total active members
    prisma.member.count({ where: { gym_id: gymId, status: 'active' } }),

    // New members this month
    prisma.member.count({ where: { gym_id: gymId, joined_at: { gte: monthStart } } }),

    // Members expired/cancelled this month
    prisma.memberPlan.count({
      where: {
        member: { gym_id: gymId },
        status: { in: ['expired', 'cancelled'] },
        updated_at: { gte: monthStart },
      },
    }),

    // Today's check-ins
    prisma.attendance.count({ where: { gym_id: gymId, checked_in_at: { gte: todayStart } } }),

    // Expiring in 7 days
    prisma.memberPlan.count({
      where: {
        member: { gym_id: gymId },
        status: 'active',
        end_date: { gte: now, lte: sevenDaysLater },
      },
    }),

    // Revenue this month
    prisma.payment.aggregate({
      where: {
        member: { gym_id: gymId },
        status: 'confirmed',
        paid_at: { gte: monthStart },
      },
      _sum: { amount: true },
    }),

    // Revenue last month
    prisma.payment.aggregate({
      where: {
        member: { gym_id: gymId },
        status: 'confirmed',
        paid_at: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { amount: true },
    }),

    // Overdue members (expired plan, unpaid)
    prisma.memberPlan.findMany({
      where: {
        member: { gym_id: gymId },
        status: 'active',
        end_date: { lt: now },
      },
      include: {
        member: { include: { user: { select: { name: true, phone: true } } } },
        plan: { select: { name: true, price: true } },
      },
      take: 10,
      orderBy: { end_date: 'asc' },
    }),

    // Upcoming renewals in 7 days
    prisma.memberPlan.findMany({
      where: {
        member: { gym_id: gymId },
        status: 'active',
        end_date: { gte: now, lte: sevenDaysLater },
      },
      include: {
        member: { include: { user: { select: { name: true } } } },
        plan: { select: { name: true, price: true } },
      },
      orderBy: { end_date: 'asc' },
    }),

    // Recent members
    prisma.member.findMany({
      where: { gym_id: gymId },
      include: {
        user: { select: { name: true, phone: true } },
        member_plans: {
          where: { status: 'active' },
          include: { plan: { select: { name: true } } },
          take: 1,
        },
      },
      orderBy: { joined_at: 'desc' },
      take: 5,
    }),

    prisma.attendance.groupBy({
      by: ['checked_in_at'],
      where: {
        gym_id: gymId,
        checked_in_at: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: { id: true },
    }),

    // Plan distribution
    prisma.memberPlan.groupBy({
      by: ['plan_id'],
      where: { member: { gym_id: gymId }, status: 'active' },
      _count: { id: true },
    }),

    // Today's check-ins list
    prisma.attendance.findMany({
      where: { gym_id: gymId, checked_in_at: { gte: todayStart } },
      include: {
        member: {
          select: {
            profile_photo_url: true,
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { checked_in_at: 'desc' },
      take: 10,
    }),

    // Top members (streaks/attendance)
    prisma.member.findMany({
      where: { gym_id: gymId, status: 'active' },
      select: {
        id: true,
        profile_photo_url: true,
        user: { select: { name: true } },
        _count: {
          select: { attendance: { where: { checked_in_at: { gte: monthStart } } } }
        }
      },
      take: 5,
    }),
  ]);

  const plans = await prisma.membershipPlan.findMany({
    where: { gym_id: gymId },
    select: { id: true, name: true },
  });

  const formattedPlanDist = planDistribution.map(pd => ({
    name: plans.find(p => p.id === pd.plan_id)?.name || 'Unknown',
    value: pd._count.id,
  }));

  // Calculate attendance rate (simplified)
  const daysInMonth = now.getDate();
  const avgAttendance = totalActive > 0 ? (dailyCheckins.reduce((sum, d) => sum + d._count.id, 0) / (totalActive * daysInMonth)) * 100 : 0;

  const currentRevenue = revenueThisMonth._sum.amount || 0;
  const lastRevenue = revenueLastMonth._sum.amount || 0;
  const revenueChange = lastRevenue > 0
    ? parseFloat(((currentRevenue - lastRevenue) / lastRevenue * 100).toFixed(1))
    : 0;

  return sendSuccess(res, {
    kpis: {
      total_active_members: totalActive,
      new_members_this_month: newThisMonth,
      members_lost_this_month: expiredThisMonth,
      todays_checkins: todayCheckins,
      expiring_soon_count: expiringSoon,
      revenue_this_month: currentRevenue,
      revenue_last_month: lastRevenue,
      revenue_change_pct: revenueChange,
      avg_attendance_rate: parseFloat(avgAttendance.toFixed(1)),
    },
    overdue_members: overdueMembers,
    upcoming_renewals: upcomingRenewals,
    recent_members: recentMembers,
    daily_checkins: dailyCheckins,
    plan_distribution: formattedPlanDist,
    todays_checkins_list: todaysCheckinsList,
    top_members: topMembers.map(m => ({
      id: m.id,
      name: (m as any).user.name,
      photo: (m as any).profile_photo_url,
      attendance_count: (m as any)._count.attendance,
      attendance_rate: Math.min(Math.round(((m as any)._count.attendance / daysInMonth) * 100), 100),
    })).sort((a, b) => b.attendance_count - a.attendance_count),
  });
});

// GET /api/v1/dashboard/revenue-chart
router.get('/revenue-chart', async (req, res) => {
  const gymId = req.user!.gymId;
  const now = new Date();

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 0) };
  }).reverse();

  const revenueData = await Promise.all(
    months.map(async (m) => {
      const agg = await prisma.payment.aggregate({
        where: {
          member: { gym_id: gymId },
          status: 'confirmed',
          paid_at: { gte: m.start, lte: m.end },
        },
        _sum: { amount: true },
        _count: { id: true },
      });
      return {
        month: `${m.year}-${String(m.month).padStart(2, '0')}`,
        revenue: agg._sum.amount || 0,
        transactions: agg._count.id,
      };
    })
  );

  return sendSuccess(res, revenueData);
});

// GET /api/v1/dashboard/trainer-stats
router.get('/trainer-stats', async (req, res) => {
  const trainers = await prisma.user.findMany({
    where: { gym_id: req.user!.gymId, role: 'trainer', is_active: true },
    include: {
      trainer_members: {
        include: {
          member: {
            include: {
              attendance: {
                where: { checked_in_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
              },
              member_plans: { where: { status: 'active' }, take: 1 },
            },
          },
        },
      },
    },
  });

  const stats = trainers.map((t) => {
    const members = t.trainer_members.map((tm) => tm.member);
    const totalAttendance = members.reduce((sum, m) => sum + m.attendance.length, 0);
    const avgAttendance = members.length > 0 ? totalAttendance / members.length : 0;

    return {
      trainer: { id: t.id, name: t.name, email: t.email },
      member_count: members.length,
      avg_attendance_per_member: parseFloat(avgAttendance.toFixed(1)),
    };
  });

  return sendSuccess(res, stats);
});

export default router;

import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const gymId = req.user!.gymId;
  const now = new Date();

  try {
    // 1. Revenue & Member Growth (Last 6 Months)
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = d.toLocaleString('en-IN', { month: 'short' });

      // Revenue
      const rev = await prisma.payment.aggregate({
        where: {
          member: { gym_id: gymId },
          status: 'confirmed',
          paid_at: { gte: d, lte: end }
        },
        _sum: { amount: true }
      });

      // New Members
      const newMembers = await prisma.member.count({
        where: {
          gym_id: gymId,
          joined_at: { gte: d, lte: end }
        }
      });

      // Expenses
      const exp = await prisma.expense.aggregate({
        where: {
          gym_id: gymId,
          expense_date: { gte: d, lte: end }
        },
        _sum: { amount: true }
      });

      // Enquiries
      const enqCount = await prisma.enquiry.count({
        where: {
          gym_id: gymId,
          created_at: { gte: d, lte: end }
        }
      });

      trends.push({
        month: monthLabel,
        revenue: rev._sum.amount || 0,
        expenses: exp._sum.amount || 0,
        new_members: newMembers,
        enquiries: enqCount
      });
    }

    // 2. Plan Distribution
    const activePlans = await prisma.memberPlan.findMany({
      where: {
        member: { gym_id: gymId },
        status: 'active'
      },
      include: { plan: true }
    });

    const planStats: Record<string, number> = {};
    activePlans.forEach(mp => {
      const name = mp.plan?.name || 'Custom';
      planStats[name] = (planStats[name] || 0) + 1;
    });

    const plan_distribution = Object.entries(planStats).map(([name, count]) => ({
      name,
      value: count
    }));

    // 3. Attendance by Day of Week (Last 30 Days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentCheckins = await prisma.attendance.findMany({
      where: {
        member: { gym_id: gymId },
        checked_in_at: { gte: thirtyDaysAgo }
      }
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const attendanceByDay = [0, 0, 0, 0, 0, 0, 0];
    recentCheckins.forEach(record => {
      const dayIndex = new Date(record.checked_in_at).getDay();
      attendanceByDay[dayIndex]++;
    });

    // 4. Latest Enquiries
    const latestEnquiries = await prisma.enquiry.findMany({
      where: { gym_id: gymId },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    // 5. Latest Expenses
    const latestExpenses = await prisma.expense.findMany({
      where: { gym_id: gymId },
      orderBy: { expense_date: 'desc' },
      take: 5
    });

    // Reorder array to start from Monday instead of Sunday for business logic
    const attendance_trend = [
      { day: 'Mon', visits: attendanceByDay[1] },
      { day: 'Tue', visits: attendanceByDay[2] },
      { day: 'Wed', visits: attendanceByDay[3] },
      { day: 'Thu', visits: attendanceByDay[4] },
      { day: 'Fri', visits: attendanceByDay[5] },
      { day: 'Sat', visits: attendanceByDay[6] },
      { day: 'Sun', visits: attendanceByDay[0] },
    ];

    return sendSuccess(res, {
      trends,
      plan_distribution,
      attendance_trend,
      latestEnquiries,
      latestExpenses
    });

  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch analytics');
  }
});

export const analyticsRouter = router;

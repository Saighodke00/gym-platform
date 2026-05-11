import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response';
import { sendNotification } from '../utils/notifications';

const router = Router();

// Add a public-ish health check for payments
router.get('/ping', (req, res) => res.json({ status: 'ok', service: 'payments' }));

// Apply auth to all routes below
router.use(authenticate);

// GET /api/v1/payments
router.get('/', async (req, res) => {
  const { search, status } = req.query;
  const gymId = req.user!.gymId;

  console.log(`[Payments API] Fetching payments for gym: ${gymId}`);

  try {
    const where: any = {
      member: { gym_id: gymId }
    };

    if (status && status !== 'All') {
      where.status = status.toLowerCase();
    }

    if (search) {
      where.OR = [
        { member: { user: { name: { contains: String(search) } } } },
        { invoice_number: { contains: String(search) } }
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        member: { 
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        member_plan: { include: { plan: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    return sendSuccess(res, payments);
  } catch (error) {
    console.error('[Payments API] List Error:', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch payments');
  }
});

// GET /api/v1/payments/stats
router.get('/stats', async (req, res) => {
  const gymId = req.user!.gymId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  console.log(`[Payments API] Fetching stats for gym: ${gymId}`);

  try {
    const [totalRevenue, monthlyRevenue, methodStats, activePlans] = await Promise.all([
      prisma.payment.aggregate({
        where: { member: { gym_id: gymId }, status: 'confirmed' },
        _sum: { amount: true, gst_amount: true }
      }),
      prisma.payment.aggregate({
        where: { 
          member: { gym_id: gymId }, 
          status: 'confirmed',
          paid_at: { gte: monthStart }
        },
        _sum: { amount: true, gst_amount: true }
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where: { member: { gym_id: gymId }, status: 'confirmed' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.memberPlan.findMany({
        where: { 
          member: { gym_id: gymId },
          status: 'active'
        },
        include: { 
          plan: true,
          member: { include: { user: { select: { name: true, phone: true } } } }
        }
      })
    ]);

    // Calculate trends for chart (last 6 months)
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const label = d.toLocaleString('en-IN', { month: 'short' });
      
      const sum = await prisma.payment.aggregate({
        where: {
          member: { gym_id: gymId },
          status: 'confirmed',
          paid_at: { gte: d, lte: end }
        },
        _sum: { amount: true }
      });
      
      trendData.push({ name: label, value: sum._sum.amount || 0 });
    }

    let outstandingDues = 0;
    const overdueMembers: any[] = [];
    activePlans.forEach((mp: any) => {
      const price = mp.plan?.price || 0;
      const discount = mp.discount_applied || 0;
      const paid = mp.amount_paid || 0;
      const due = (price - discount) - paid;
      
      if (due > 0) {
        outstandingDues += due;
        overdueMembers.push({
          id: mp.member.id,
          name: mp.member.user.name,
          phone: mp.member.user.phone,
          photo: mp.member.profile_photo_url,
          plan_name: mp.plan?.name || 'Plan',
          due_amount: due,
          days_overdue: Math.floor((now.getTime() - mp.created_at.getTime()) / (1000 * 60 * 60 * 24))
        });
      }
    });

    const latestExpenses = await prisma.expense.findMany({
      where: { gym_id: gymId },
      orderBy: { expense_date: 'desc' },
      take: 5
    });

    return sendSuccess(res, {
      summary: {
        revenue_this_month: monthlyRevenue._sum.amount || 0,
        total_revenue: totalRevenue._sum.amount || 0,
        outstanding_dues: outstandingDues,
        active_members: activePlans.length,
      },
      methods: {
        bank: {
          _sum: { amount: methodStats.filter(m => m.method === 'card' || m.method === 'bank_transfer').reduce((sum, m) => sum + (m._sum.amount || 0), 0) },
          _count: { id: methodStats.filter(m => m.method === 'card' || m.method === 'bank_transfer').reduce((sum, m) => sum + (m._count.id || 0), 0) }
        },
        upi: methodStats.find(m => m.method === 'upi') || { _sum: { amount: 0 }, _count: { id: 0 } },
        cash: methodStats.find(m => m.method === 'cash') || { _sum: { amount: 0 }, _count: { id: 0 } },
      },
      trend: trendData,
      overdue: overdueMembers.slice(0, 5),
      latestExpenses: latestExpenses
    });

  } catch (error) {
    console.error('[Payments API] Stats Error:', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to calculate statistics');
  }
});

// PATCH /api/v1/payments/:id/confirm
router.patch('/:id/confirm', async (req, res) => {
  const { id } = req.params;

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id },
        data: { status: 'confirmed', paid_at: new Date() }
      });

      if (p.member_plan_id) {
        await tx.memberPlan.update({
          where: { id: p.member_plan_id },
          data: { amount_paid: { increment: p.amount } }
        });
      }

      return p;
    });

    return sendSuccess(res, payment);
  } catch (error) {
    console.error('[Payments API] Confirm Error:', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to confirm payment');
  }
});

// POST /api/v1/payments/send-reminder
router.post('/send-reminder', async (req, res) => {
  const { member_id, amount, plan_name } = req.body;

  try {
    const member = await prisma.member.findUnique({
      where: { id: member_id },
      include: { user: true }
    });

    if (!member || !member.user.phone) {
      return sendError(res, ErrorCodes.NOT_FOUND, 'Member or phone number not found');
    }

    const message = `Hi ${member.user.name}, this is a friendly reminder from GDK Gym regarding your pending dues for the ${plan_name} plan. Amount due: ₹${amount}. Please clear it at your earliest convenience. Thank you! 🙏`;

    await sendNotification({
      email: member.user.email,
      subject: 'Payment Reminder - GDK Gym',
      message,
      channel: 'email'
    });
    return sendSuccess(res, { message: 'Reminder sent via Email' });
  } catch (error) {
    console.error('[Payments API] Reminder Error:', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to send notification');
  }
});

// POST /api/v1/payments/record
router.post('/record', async (req, res) => {
  const { member_id, member_plan_id, amount, method, notes } = req.body;

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          member_id,
          member_plan_id,
          amount,
          method,
          status: 'confirmed',
          paid_at: new Date(),
          notes
        }
      });

      if (member_plan_id) {
        await tx.memberPlan.update({
          where: { id: member_plan_id },
          data: { amount_paid: { increment: amount } }
        });
      }

      return p;
    });

    return sendSuccess(res, payment, 201);
  } catch (error) {
    console.error('[Payments API] Record Error:', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to record payment');
  }
});

export default router;

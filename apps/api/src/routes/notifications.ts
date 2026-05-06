import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { sendNotification, getExpiryMessage } from '../utils/notifications';

const router = Router();
router.use(authenticate, authorize('admin'));

// POST /api/v1/notifications/send-expiry-reminders
router.post('/send-expiry-reminders', async (req, res) => {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  // Find active plans expiring within the next 3 days
  const expiringPlans = await prisma.memberPlan.findMany({
    where: {
      gym_id: req.user!.gymId,
      status: 'active',
      end_date: {
        gte: now,
        lte: threeDaysFromNow,
      },
    },
    include: {
      member: {
        include: { user: { select: { name: true, phone: true } } }
      }
    }
  });

  let sentCount = 0;
  for (const plan of expiringPlans) {
    if (plan.member.user.phone) {
      const daysLeft = Math.ceil((plan.end_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const message = getExpiryMessage(plan.member.user.name, daysLeft);
      const result = await sendNotification({
        email: plan.member.user.email,
        subject: 'Membership Expiry Alert',
        message,
        channel: 'email'
      });
      if (result.email) sentCount++;
    }
  }

  return sendSuccess(res, {
    message: `Expiry reminders processed successfully.`,
    sent_count: sentCount,
    checked_count: expiringPlans.length,
  });
});

export default router;

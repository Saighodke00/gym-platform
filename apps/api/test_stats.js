const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const gymId = 'seed-gym-001';
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

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

    console.log('Total Revenue:', JSON.stringify(totalRevenue, null, 2));
    console.log('Monthly Revenue:', JSON.stringify(monthlyRevenue, null, 2));
    console.log('Method Stats:', JSON.stringify(methodStats, null, 2));
    console.log('Active Plans Count:', activePlans.length);

    let outstandingDues = 0;
    activePlans.forEach((mp) => {
      const totalToPay = (mp.plan?.price || 0) - (mp.discount_applied || 0);
      const due = totalToPay - (mp.amount_paid || 0);
      if (due > 0) outstandingDues += due;
    });
    console.log('Outstanding Dues:', outstandingDues);

  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

check();

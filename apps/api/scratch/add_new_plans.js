const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Adding new membership plans...');

  const gym = await prisma.gym.findFirst();
  if (!gym) {
    console.error('❌ No gym found. Please seed the database first.');
    process.exit(1);
  }

  const newPlans = [
    {
      id: 'plan-couple-special',
      name: 'Couple Special',
      description: 'Discounted monthly plan for two members joining together',
      duration_days: 30,
      price: 2500,
      gst_rate: 18,
      features: ['Gym Access for 2', 'Locker Room', 'Shared Trainer (1 session/week)', 'Progress Tracking'],
    },
    {
      id: 'plan-corporate-yearly',
      name: 'Corporate Yearly',
      description: 'Exclusive annual plan for corporate employees',
      duration_days: 365,
      price: 10000,
      gst_rate: 18,
      features: ['Unlimited Gym Access', 'All Group Classes', 'Priority Locker', 'Quarterly Health Checkup'],
    },
    {
      id: 'plan-weekend-warrior',
      name: 'Weekend Warrior',
      description: 'Ideal for busy professionals — access on Saturdays and Sundays only',
      duration_days: 30,
      price: 800,
      gst_rate: 18,
      features: ['Weekend Gym Access', 'Locker Room'],
    },
    {
      id: 'plan-transformation-pack',
      name: 'Transformation Pack',
      description: 'Intense 90-day program to transform your physique',
      duration_days: 90,
      price: 6000,
      gst_rate: 18,
      features: ['Gym Access', 'Personal Training (3x/week)', 'Custom Diet Plan', 'Supplement Consultation', 'Weekly Body Analysis'],
    },
  ];

  for (const plan of newPlans) {
    await prisma.membershipPlan.upsert({
      where: { id: plan.id },
      update: {
        ...plan,
        gym_id: gym.id,
        features: JSON.stringify(plan.features),
      },
      create: {
        ...plan,
        gym_id: gym.id,
        features: JSON.stringify(plan.features),
      },
    });
    console.log(`✅ Plan added/updated: ${plan.name}`);
  }

  console.log('🎉 All new plans added successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

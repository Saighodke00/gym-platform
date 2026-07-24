import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GDK database...');

  // ─── GYM ─────────────────────────────────────────────────────────────────
  const gym = await prisma.gym.upsert({
    where: { id: 'seed-gym-001' },
    update: {},
    create: {
      id: 'seed-gym-001',
      name: 'GDK Fitness Hub',
      address: '123 MG Road, Bangalore, Karnataka 560001',
      phone: '+91 9876543210',
      email: 'admin@gdkgym.com',
      gstin: '29ABCDE1234F1Z5',
      whatsapp_number: '919876543210',
      absence_threshold: 7,
    },
  });
  console.log('✅ Gym created:', gym.name);

  // ─── ADMIN USER ───────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@GDK123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gdkgym.com' },
    update: {},
    create: {
      gym_id: gym.id,
      name: 'GDK Admin',
      email: 'admin@gdkgym.com',
      phone: '9876543210',
      role: 'admin',
      password_hash: adminPassword,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ─── TRAINER ─────────────────────────────────────────────────────────────
  const trainerPassword = await bcrypt.hash('Trainer@GDK123', 12);
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@gdkgym.com' },
    update: {},
    create: {
      gym_id: gym.id,
      name: 'Rajesh Kumar',
      email: 'trainer@gdkgym.com',
      phone: '9876543211',
      role: 'trainer',
      password_hash: trainerPassword,
    },
  });
  console.log('✅ Trainer created:', trainer.email);

  // ─── MEMBERSHIP PLANS ─────────────────────────────────────────────────────
  const plans = [
    { name: 'Monthly Basic', description: 'Gym access only', duration_days: 30, price: 1500, gst_rate: 18, features: ['Gym Access', 'Locker Room', 'Free WiFi'] },
    { name: 'Student Monthly', description: 'Discounted plan for students', duration_days: 30, price: 999, gst_rate: 18, features: ['Gym Access', 'Locker Room'] },
    { name: 'Quarterly Pro', description: 'Gym + 1 trainer session/week', duration_days: 90, price: 4000, gst_rate: 18, features: ['Gym Access', 'Trainer Sessions (4/month)', 'Diet Consultation', 'Locker Room'] },
    { name: 'Annual Premium', description: 'Best value — all-inclusive yearly membership', duration_days: 365, price: 12000, gst_rate: 18, features: ['Unlimited Gym Access', 'Personal Trainer', 'Diet Plan', 'Body Analysis Monthly', 'Guest Passes (5)', 'Priority Booking'] }
  ];

  for (const planData of plans) {
    await prisma.membershipPlan.upsert({
      where: { id: `seed-plan-${planData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` },
      update: {},
      create: {
        id: `seed-plan-${planData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        gym_id: gym.id,
        ...planData,
        features: JSON.stringify(planData.features),
      },
    });
  }
  console.log('✅ Membership plans created');

  const allPlans = await prisma.membershipPlan.findMany({ where: { gym_id: gym.id } });

  // ─── MOCK MEMBERS ─────────────────────────────────────────────────────
  const memberData = [
    { name: 'Amit Sharma', email: 'amit.sharma@example.com', phone: '9111111111', planIndex: 0 },
    { name: 'Priya Singh', email: 'priya.singh@example.com', phone: '9222222222', planIndex: 2 },
    { name: 'Rohan Gupta', email: 'rohan.gupta@example.com', phone: '9333333333', planIndex: 3 },
    { name: 'Neha Verma', email: 'neha.verma@example.com', phone: '9444444444', planIndex: 0 },
    { name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '9555555555', planIndex: 2 },
  ];

  const defaultPassword = await bcrypt.hash('Member@123', 12);
  let memberCount = 1000;

  for (const mData of memberData) {
    const existingUser = await prisma.user.findUnique({ where: { email: mData.email } });
    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          gym_id: gym.id,
          name: mData.name,
          email: mData.email,
          phone: mData.phone,
          role: 'member',
          password_hash: defaultPassword,
        }
      });

      const member = await prisma.member.create({
        data: {
          gym_id: gym.id,
          user_id: user.id,
          member_code: `M${memberCount++}`,
          status: 'active',
          joined_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Joined 30 days ago
        }
      });

      const selectedPlan = allPlans[mData.planIndex];
      const memberPlan = await prisma.memberPlan.create({
        data: {
          member_id: member.id,
          plan_id: selectedPlan.id,
          start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Started 15 days ago
          end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Ends 15 days from now
          amount_paid: selectedPlan.price,
          status: 'active'
        }
      });

      await prisma.payment.create({
        data: {
          member_id: member.id,
          member_plan_id: memberPlan.id,
          amount: selectedPlan.price,
          gst_amount: selectedPlan.price * 0.18,
          method: 'cash',
          status: 'completed',
          invoice_number: `INV-${member.member_code}-1`,
          paid_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        }
      });

      // ─── ATTENDANCE FOR MEMBER ───────────────────────────────────────────
      for (let i = 1; i <= 5; i++) {
        const checkInDate = new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000);
        await prisma.attendance.create({
          data: {
            member_id: member.id,
            gym_id: gym.id,
            checked_in_at: checkInDate,
            method: 'qr'
          }
        });
      }
    }
  }
  console.log('✅ Mock Members, Plans, Payments, and Attendance created');

  // ─── BROADCASTS ────────────────────────────────────────────────────────
  await prisma.broadcast.createMany({
    data: [
      {
        gym_id: gym.id,
        title: 'Gym Maintenance this Sunday',
        message: 'Dear Members, the gym will be closed for maintenance this Sunday from 9 AM to 2 PM.',
        target_type: 'all',
        status: 'delivered',
        delivered_count: 5,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        gym_id: gym.id,
        title: 'New Zumba Classes!',
        message: 'Join our new Zumba batches starting next Monday at 6 PM.',
        target_type: 'active',
        status: 'delivered',
        delivered_count: 5,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ],
    skipDuplicates: true,
  });
  console.log('✅ Broadcasts created');

  // ─── ENQUIRIES ─────────────────────────────────────────────────────────
  await prisma.enquiry.createMany({
    data: [
      { gym_id: gym.id, name: 'Suresh Kumar', phone: '9888888888', status: 'new', interested_in: 'Weight Loss' },
      { gym_id: gym.id, name: 'Aditi Rao', phone: '9777777777', status: 'demo', interested_in: 'Yoga' },
      { gym_id: gym.id, name: 'Karan Patel', phone: '9666666666', status: 'contacted', interested_in: 'Personal Training' }
    ],
    skipDuplicates: true,
  });
  console.log('✅ Enquiries created');

  // ─── EXPENSES ──────────────────────────────────────────────────────────
  await prisma.expense.createMany({
    data: [
      { gym_id: gym.id, category: 'Rent', amount: 50000, description: 'Monthly Rent - July', expense_date: new Date() },
      { gym_id: gym.id, category: 'Electricity', amount: 8000, description: 'Electricity Bill', expense_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { gym_id: gym.id, category: 'Equipment', amount: 12000, description: 'New Dumbbells', expense_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Expenses created');

  console.log('\n🎉 Comprehensive database seeding completed successfully!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

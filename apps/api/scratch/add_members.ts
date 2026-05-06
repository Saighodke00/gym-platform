import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addMembers() {
  const gymId = 'seed-gym-001';
  const membersData = [
    { name: 'Rahul Sharma', email: 'rahul.final2@example.com', phone: '9988776655', planName: 'Monthly Basic' },
    { name: 'Priya Patel', email: 'priya.final2@example.com', phone: '9988776654', planName: 'Quarterly Pro' },
    { name: 'Amit Singh', email: 'amit.final2@example.com', phone: '9988776653', planName: 'Half-Yearly Elite' },
    { name: 'Sneha Reddy', email: 'sneha.final2@example.com', phone: '9988776652', planName: 'Annual Premium' },
    { name: 'Vikram Malhotra', email: 'vikram.final2@example.com', phone: '9988776651', planName: 'Student Monthly' },
  ];

  console.log('🚀 Adding 5 members...');

  for (let i = 0; i < membersData.length; i++) {
    const data = membersData[i];
    const passwordHash = await bcrypt.hash('Member@123', 12);
    const memberCode = `GDK-2026-900${i + 1}`;

    try {
      // 1. Create User
      const user = await prisma.user.create({
        data: {
          gym_id: gymId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: 'member',
          password_hash: passwordHash,
        }
      });

      // 2. Find Plan
      const plan = await prisma.membershipPlan.findFirst({
        where: { name: data.planName, gym_id: gymId }
      });

      if (!plan) {
        console.error(`Plan ${data.planName} not found`);
        continue;
      }

      // 3. Create Member
      const member = await prisma.member.create({
        data: {
          member_code: memberCode,
          status: 'active',
          user: { connect: { id: user.id } },
          gym: { connect: { id: gymId } }
        }
      });

      // 4. Assign Plan
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration_days);

      await prisma.memberPlan.create({
        data: {
          member_id: member.id,
          plan_id: plan.id,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          amount_paid: plan.price,
        }
      });

      console.log(`✅ Added: ${data.name} (${memberCode}) with ${data.planName}`);
    } catch (err) {
      console.error(`❌ Failed to add ${data.name}:`, (err as any).message);
    }
  }

  console.log('✨ Finished adding members.');
  await prisma.$disconnect();
}

addMembers();

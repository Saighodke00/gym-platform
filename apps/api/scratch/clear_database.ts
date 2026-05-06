import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️ Clearing all database tables...');

  try {
    // Delete in order to satisfy foreign key constraints
    await prisma.attendance.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.memberPlan.deleteMany({});
    await prisma.timelineEvent.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.feedback.deleteMany({});
    await prisma.progressLog.deleteMany({});
    await prisma.sessionNote.deleteMany({});
    await prisma.memberDocument.deleteMany({});
    await prisma.memberWorkoutSession.deleteMany({});
    await prisma.trainerMember.deleteMany({});
    
    // Now delete members and plans
    await prisma.member.deleteMany({});
    await prisma.membershipPlan.deleteMany({});
    
    // Delete users except for gym owners (admins)
    // Actually, usually easier to delete all users if we're going to re-seed
    await prisma.user.deleteMany({
      where: {
        role: { not: 'admin' }
      }
    });

    console.log('✅ Database cleared (except for Admin accounts).');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();

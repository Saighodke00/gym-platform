const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setExpiry() {
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  console.log(`Setting all active memberships to expire on: ${threeDaysFromNow.toISOString()}`);

  try {
    const result = await prisma.memberPlan.updateMany({
      where: {
        status: 'active'
      },
      data: {
        end_date: threeDaysFromNow
      }
    });

    console.log(`Successfully updated ${result.count} memberships.`);
    
    // Also update the member status to expiring_soon if we have logic for that
    // Usually status is calculated on the fly or by a cron, but let's see.
    
  } catch (error) {
    console.error('Error updating memberships:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

setExpiry();

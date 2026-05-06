const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.membershipPlan.findMany();
  console.log('Plans:', JSON.stringify(plans, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

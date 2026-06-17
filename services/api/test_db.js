const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://wealthspot_admin:admin_pass_123@localhost:5432/wealthspot' } }
});

async function run() {
  const opp = await prisma.opportunity.findFirst({
    where: { title: { contains: '50-Acre' } }
  });
  console.log('MIN_INVESTMENT:', opp.min_investment);
  console.log('SPECS:', JSON.stringify(opp.property_specs, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());

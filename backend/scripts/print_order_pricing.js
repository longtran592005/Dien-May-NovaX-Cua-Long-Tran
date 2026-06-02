const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  await prisma.$connect();
  try {
    const orderId = process.argv[2] || '78e48023-c9b2-4888-a73c-be67c00ab222';
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    console.log(JSON.stringify(order ? order.pricingSnapshot : null, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

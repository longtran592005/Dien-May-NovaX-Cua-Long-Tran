const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('Total users:', users.length);
  console.log('Users:', JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

check();

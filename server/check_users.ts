import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      emailVerified: true,
      createdAt: true,
    },
  });
  console.log('Users in database:');
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

checkUsers().catch(console.error);

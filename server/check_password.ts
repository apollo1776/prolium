import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkPassword() {
  const user = await prisma.user.findUnique({
    where: { email: 'islam.hasanov.co@gmail.com' },
    select: {
      email: true,
      passwordHash: true,
    },
  });
  
  console.log('User found:', !!user);
  console.log('Has password hash:', !!user?.passwordHash);
  console.log('Hash starts with $2b$:', user?.passwordHash?.startsWith('$2b$'));
  
  if (user?.passwordHash) {
    const testPassword = 'test1234';
    const isValid = await bcrypt.compare(testPassword, user.passwordHash);
    console.log(`Password "test1234" matches:`, isValid);
    
    // Test a few other common passwords
    const passwords = ['Test1234', 'password', '12345678', 'test'];
    for (const pwd of passwords) {
      const match = await bcrypt.compare(pwd, user.passwordHash);
      if (match) {
        console.log(`Password "${pwd}" MATCHES!`);
      }
    }
  }
  
  await prisma.$disconnect();
}

checkPassword().catch(console.error);

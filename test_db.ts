import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing DB connection...');
  try {
    const userCount = await prisma.user.count();
    console.log(`Success! Connected to Neon DB. User count: ${userCount}`);
  } catch (err) {
    console.error('Failed to connect to Neon DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

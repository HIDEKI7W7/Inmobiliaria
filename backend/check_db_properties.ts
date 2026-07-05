import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all properties from database...');
  try {
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        location: true,
      }
    });
    console.log('Properties in DB:', JSON.stringify(properties, null, 2));
  } catch (err) {
    console.error('Failed to fetch properties:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

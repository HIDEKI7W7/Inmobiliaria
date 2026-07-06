import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const properties = await prisma.property.findMany({});
    console.log(`Total properties in DB: ${properties.length}`);
    properties.forEach(p => {
      console.log(`- ID: ${p.id}, Title: ${p.title}, Status: ${p.status}, DeletedAt: ${p.deletedAt}`);
    });
  } catch (err) {
    console.error('Failed to query Neon DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

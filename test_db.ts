import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning contaminated properties from DB...');
  try {
    const deleteResult = await prisma.property.deleteMany({
      where: {
        title: 'Propiedad de Catálogo'
      }
    });
    console.log('Delete result:', deleteResult);

    const remainingCount = await prisma.property.count();
    console.log(`Remaining property count: ${remainingCount}`);
  } catch (err) {
    console.error('Failed to clean Neon DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

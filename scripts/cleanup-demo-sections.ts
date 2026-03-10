import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up demo sections...');
  
  // Delete the sub-section first due to foreign key constraints (if any)
  const deletedSub = await prisma.section.deleteMany({
    where: {
      slug: 'demo-sub-section',
    },
  });
  console.log(`Deleted ${deletedSub.count} sub-sections.`);

  // Delete the main section
  const deletedMain = await prisma.section.deleteMany({
    where: {
      slug: 'demo-section',
    },
  });
  console.log(`Deleted ${deletedMain.count} main sections.`);

  console.log('Cleanup complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

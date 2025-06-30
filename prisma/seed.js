async function main() {
  const { PrismaClient } = await import('../src/generated/prisma/index.js');
  const prisma = new PrismaClient();

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
  ];

  for (const day of days) {
    await prisma.availability.upsert({
      where: { id: `${day}-12-20` },
      update: {},
      create: {
        id: `${day}-12-20`,
        day,
        startTime: '12:00',
        endTime: '20:00',
      },
    });
  }
  console.log('Seeded availability for weekdays 12:00-20:00');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

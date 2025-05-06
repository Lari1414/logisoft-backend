// prisma/reset.ts
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  await prisma.lagerbestand.deleteMany();
  await prisma.wareneingang.deleteMany();
  await prisma.mindestbestand.deleteMany();
  await prisma.materialbestellung.deleteMany();
  await prisma.material.deleteMany();
  await prisma.lieferant.deleteMany();
  await prisma.qualitaet.deleteMany();
  await prisma.lager.deleteMany();
  await prisma.adresse.deleteMany();
  console.log('Alle Daten wurden gelöscht.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

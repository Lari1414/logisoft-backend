-- DropForeignKey
ALTER TABLE "Lagerbestand" DROP CONSTRAINT "Lagerbestand_qualitaet_ID_fkey";

-- AlterTable
ALTER TABLE "Lagerbestand" ALTER COLUMN "qualitaet_ID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Lagerbestand" ADD CONSTRAINT "Lagerbestand_qualitaet_ID_fkey" FOREIGN KEY ("qualitaet_ID") REFERENCES "Qualitaet"("qualitaet_ID") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `menge` to the `Materialbestellung` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Lagerbestand" DROP CONSTRAINT "Lagerbestand_qualitaet_ID_fkey";

-- AlterTable
ALTER TABLE "Lagerbestand" ALTER COLUMN "qualitaet_ID" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Materialbestellung" ADD COLUMN     "menge" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Lagerbestand" ADD CONSTRAINT "Lagerbestand_qualitaet_ID_fkey" FOREIGN KEY ("qualitaet_ID") REFERENCES "Qualitaet"("qualitaet_ID") ON DELETE SET NULL ON UPDATE CASCADE;

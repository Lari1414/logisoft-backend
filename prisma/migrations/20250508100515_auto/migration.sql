/*
  Warnings:

  - Made the column `qualitaet_ID` on table `Lagerbestand` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Lagerbestand" DROP CONSTRAINT "Lagerbestand_qualitaet_ID_fkey";

-- AlterTable
ALTER TABLE "Lagerbestand" ALTER COLUMN "qualitaet_ID" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Lagerbestand" ADD CONSTRAINT "Lagerbestand_qualitaet_ID_fkey" FOREIGN KEY ("qualitaet_ID") REFERENCES "Qualitaet"("qualitaet_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

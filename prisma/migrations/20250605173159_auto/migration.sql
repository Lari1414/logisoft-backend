-- DropForeignKey
ALTER TABLE "Auftrag" DROP CONSTRAINT "Auftrag_lagerbestand_ID_fkey";

-- AlterTable
ALTER TABLE "Auftrag" ALTER COLUMN "lagerbestand_ID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Auftrag" ADD CONSTRAINT "Auftrag_lagerbestand_ID_fkey" FOREIGN KEY ("lagerbestand_ID") REFERENCES "Lagerbestand"("lagerbestand_ID") ON DELETE SET NULL ON UPDATE CASCADE;

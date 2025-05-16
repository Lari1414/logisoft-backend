-- AlterTable
ALTER TABLE "Wareneingang" ADD COLUMN     "qualitaet_ID" INTEGER;

-- AddForeignKey
ALTER TABLE "Wareneingang" ADD CONSTRAINT "Wareneingang_qualitaet_ID_fkey" FOREIGN KEY ("qualitaet_ID") REFERENCES "Qualitaet"("qualitaet_ID") ON DELETE SET NULL ON UPDATE CASCADE;

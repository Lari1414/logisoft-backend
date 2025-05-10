-- DropForeignKey
ALTER TABLE "Lagerbestand" DROP CONSTRAINT "Lagerbestand_eingang_ID_fkey";

-- AlterTable
ALTER TABLE "Auftrag" ALTER COLUMN "bestellposition" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Lagerbestand" ALTER COLUMN "eingang_ID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Lagerbestand" ADD CONSTRAINT "Lagerbestand_eingang_ID_fkey" FOREIGN KEY ("eingang_ID") REFERENCES "Wareneingang"("eingang_ID") ON DELETE SET NULL ON UPDATE CASCADE;

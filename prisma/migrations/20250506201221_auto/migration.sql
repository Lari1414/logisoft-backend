/*
  Warnings:

  - You are about to drop the column `materialbestellung_g_ID` on the `Wareneingang` table. All the data in the column will be lost.
  - You are about to drop the column `qualitaet_ID` on the `Wareneingang` table. All the data in the column will be lost.
  - You are about to drop the `Materialbestellungen` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `strasse` on table `Adresse` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ort` on table `Adresse` required. This step will fail if there are existing NULL values in that column.
  - Made the column `plz` on table `Adresse` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bezeichnung` on table `Lager` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `qualitaet_ID` to the `Lagerbestand` table without a default value. This is not possible if the table is not empty.
  - Made the column `firmenname` on table `Lieferant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `kontaktperson` on table `Lieferant` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `materialbestellung_ID` to the `Wareneingang` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Materialbestellungen" DROP CONSTRAINT "Materialbestellungen_lieferanten_ID_fkey";

-- DropForeignKey
ALTER TABLE "Materialbestellungen" DROP CONSTRAINT "Materialbestellungen_material_ID_fkey";

-- DropForeignKey
ALTER TABLE "Wareneingang" DROP CONSTRAINT "Wareneingang_materialbestellung_g_ID_fkey";

-- DropForeignKey
ALTER TABLE "Wareneingang" DROP CONSTRAINT "Wareneingang_qualitaet_ID_fkey";

-- DropIndex
DROP INDEX "Lieferant_adresse_ID_key";

-- AlterTable
ALTER TABLE "Adresse" ALTER COLUMN "strasse" SET NOT NULL,
ALTER COLUMN "ort" SET NOT NULL,
ALTER COLUMN "plz" SET NOT NULL;

-- AlterTable
ALTER TABLE "Lager" ALTER COLUMN "bezeichnung" SET NOT NULL;

-- AlterTable
ALTER TABLE "Lagerbestand" ADD COLUMN     "qualitaet_ID" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Lieferant" ALTER COLUMN "firmenname" SET NOT NULL,
ALTER COLUMN "kontaktperson" SET NOT NULL;

-- AlterTable
ALTER TABLE "Wareneingang" DROP COLUMN "materialbestellung_g_ID",
DROP COLUMN "qualitaet_ID",
ADD COLUMN     "materialbestellung_ID" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Materialbestellungen";

-- CreateTable
CREATE TABLE "Materialbestellung" (
    "materialbestellung_ID" SERIAL NOT NULL,
    "lieferant_ID" INTEGER NOT NULL,
    "material_ID" INTEGER NOT NULL,
    "status" TEXT,

    CONSTRAINT "Materialbestellung_pkey" PRIMARY KEY ("materialbestellung_ID")
);

-- AddForeignKey
ALTER TABLE "Materialbestellung" ADD CONSTRAINT "Materialbestellung_lieferant_ID_fkey" FOREIGN KEY ("lieferant_ID") REFERENCES "Lieferant"("lieferant_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materialbestellung" ADD CONSTRAINT "Materialbestellung_material_ID_fkey" FOREIGN KEY ("material_ID") REFERENCES "Material"("material_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wareneingang" ADD CONSTRAINT "Wareneingang_materialbestellung_ID_fkey" FOREIGN KEY ("materialbestellung_ID") REFERENCES "Materialbestellung"("materialbestellung_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lagerbestand" ADD CONSTRAINT "Lagerbestand_qualitaet_ID_fkey" FOREIGN KEY ("qualitaet_ID") REFERENCES "Qualitaet"("qualitaet_ID") ON DELETE RESTRICT ON UPDATE CASCADE;
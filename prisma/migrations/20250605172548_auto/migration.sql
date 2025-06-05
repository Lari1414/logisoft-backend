/*
  Warnings:

  - Made the column `material_ID` on table `Wareneingang` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Wareneingang" DROP CONSTRAINT "Wareneingang_material_ID_fkey";

-- AlterTable
ALTER TABLE "Wareneingang" ALTER COLUMN "material_ID" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Wareneingang" ADD CONSTRAINT "Wareneingang_material_ID_fkey" FOREIGN KEY ("material_ID") REFERENCES "Material"("material_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

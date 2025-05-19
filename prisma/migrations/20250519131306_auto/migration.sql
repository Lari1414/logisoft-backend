/*
  Warnings:

  - The `farbe` column on the `Material` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Material" DROP COLUMN "farbe",
ADD COLUMN     "farbe" JSONB;

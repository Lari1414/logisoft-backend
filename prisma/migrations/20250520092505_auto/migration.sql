/*
  Warnings:

  - Added the required column `standardmaterial` to the `Material` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "farbe_json" JSONB,
ADD COLUMN     "standardmaterial" BOOLEAN NOT NULL;

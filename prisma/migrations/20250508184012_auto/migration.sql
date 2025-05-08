/*
  Warnings:

  - Added the required column `bestellposition` to the `Auftrag` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Auftrag" ADD COLUMN     "bestellposition" TEXT NOT NULL;

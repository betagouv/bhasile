/*
  Warnings:

  - You are about to drop the column `echeancePlacesACreer` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `echeancePlacesAFermer` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `placesACreer` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `placesAFermer` on the `Structure` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Structure" DROP COLUMN "echeancePlacesACreer",
DROP COLUMN "echeancePlacesAFermer",
DROP COLUMN "placesACreer",
DROP COLUMN "placesAFermer";

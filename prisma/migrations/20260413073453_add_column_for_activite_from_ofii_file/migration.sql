/*
  Warnings:

  - You are about to drop the column `placesVacantes` on the `Activite` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Activite" DROP COLUMN "placesVacantes",
ADD COLUMN     "tauxOccupation" DECIMAL(65,30);

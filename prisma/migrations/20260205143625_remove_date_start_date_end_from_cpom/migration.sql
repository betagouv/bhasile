/*
  Warnings:

  - You are about to drop the column `dateEnd` on the `Cpom` table. All the data in the column will be lost.
  - You are about to drop the column `dateStart` on the `Cpom` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cpom" DROP COLUMN "dateEnd",
DROP COLUMN "dateStart";

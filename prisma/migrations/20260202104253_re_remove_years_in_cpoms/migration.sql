/*
  Warnings:

  - You are about to drop the column `yearEnd` on the `Cpom` table. All the data in the column will be lost.
  - You are about to drop the column `yearStart` on the `Cpom` table. All the data in the column will be lost.
  - You are about to drop the column `yearEnd` on the `CpomStructure` table. All the data in the column will be lost.
  - You are about to drop the column `yearStart` on the `CpomStructure` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cpom" DROP COLUMN "yearEnd",
DROP COLUMN "yearStart";

-- AlterTable
ALTER TABLE "CpomStructure" DROP COLUMN "yearEnd",
DROP COLUMN "yearStart";

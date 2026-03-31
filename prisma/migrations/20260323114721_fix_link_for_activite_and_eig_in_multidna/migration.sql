/*
  Warnings:

  - You are about to drop the column `structureId` on the `Activite` table. All the data in the column will be lost.
  - You are about to drop the column `structureId` on the `EvenementIndesirableGrave` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dnaCode,date]` on the table `Activite` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Activite" DROP CONSTRAINT "Activite_structureId_fkey";

-- DropForeignKey
ALTER TABLE "EvenementIndesirableGrave" DROP CONSTRAINT "EvenementIndesirableGrave_structureId_fkey";

-- DropIndex
DROP INDEX "Activite_structureId_date_key";

-- AlterTable
ALTER TABLE "Activite" DROP COLUMN "structureId";

-- AlterTable
ALTER TABLE "EvenementIndesirableGrave" DROP COLUMN "structureId";

-- CreateIndex
CREATE UNIQUE INDEX "Activite_dnaCode_date_key" ON "Activite"("dnaCode", "date");

/*
  Warnings:

  - A unique constraint covering the columns `[numeroDossier]` on the table `Transformation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "StepStatus" ADD VALUE 'PRE_REMPLI';

-- AlterTable
ALTER TABLE "Transformation" ADD COLUMN     "numeroDossier" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transformation_numeroDossier_key" ON "Transformation"("numeroDossier");

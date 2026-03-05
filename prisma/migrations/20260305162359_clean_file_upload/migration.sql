/*
  Warnings:

  - You are about to drop the column `category` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `categoryName` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `granularity` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `FileUpload` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FileUpload" DROP CONSTRAINT "FileUpload_cpomId_fkey";

-- DropForeignKey
ALTER TABLE "FileUpload" DROP CONSTRAINT "FileUpload_structureDnaCode_fkey";

-- AlterTable
ALTER TABLE "FileUpload" DROP COLUMN "category",
DROP COLUMN "categoryName",
DROP COLUMN "date",
DROP COLUMN "endDate",
DROP COLUMN "granularity",
DROP COLUMN "startDate",
DROP COLUMN "structureDnaCode",
ADD COLUMN     "structureId" INTEGER;

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_cpomId_fkey" FOREIGN KEY ("cpomId") REFERENCES "Cpom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

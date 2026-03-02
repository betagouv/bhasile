/*
  Warnings:

  - You are about to drop the column `granularity` on the `Dna` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `categoryName` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `cpomId` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `granularity` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `parentFileUploadId` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `structureId` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `granularity` on the `Finess` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FileUpload" DROP CONSTRAINT "FileUpload_cpomId_fkey";

-- DropForeignKey
ALTER TABLE "FileUpload" DROP CONSTRAINT "FileUpload_parentFileUploadId_fkey";

-- DropForeignKey
ALTER TABLE "FileUpload" DROP CONSTRAINT "FileUpload_structureDnaCode_fkey";

-- AlterTable
ALTER TABLE "ActeAdministratif" ADD COLUMN     "structureId" INTEGER;

-- AlterTable
ALTER TABLE "Dna" DROP COLUMN "granularity",
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "DocumentFinancier" ADD COLUMN     "structureId" INTEGER;

-- AlterTable
ALTER TABLE "FileUpload" DROP COLUMN "category",
DROP COLUMN "categoryName",
DROP COLUMN "cpomId",
DROP COLUMN "date",
DROP COLUMN "endDate",
DROP COLUMN "granularity",
DROP COLUMN "parentFileUploadId",
DROP COLUMN "startDate",
DROP COLUMN "structureDnaCode",
DROP COLUMN "structureId";

-- AlterTable
ALTER TABLE "Finess" DROP COLUMN "granularity",
ADD COLUMN     "description" TEXT;

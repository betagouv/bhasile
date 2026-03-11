/*
  Warnings:

  - You are about to drop the column `structureMillesimeId` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `categoryName` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `cpomId` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `granularity` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `parentFileUploadId` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `budgetId` on the `StructureMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `structureTypologieId` on the `StructureMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `structureMillesimeId` on the `StructureTypologie` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_structureMillesimeId_fkey";

-- DropForeignKey
ALTER TABLE "FileUpload" DROP CONSTRAINT "FileUpload_cpomId_fkey";

-- DropForeignKey
ALTER TABLE "FileUpload" DROP CONSTRAINT "FileUpload_parentFileUploadId_fkey";

-- DropForeignKey
ALTER TABLE "FileUpload" DROP CONSTRAINT "FileUpload_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "StructureTypologie" DROP CONSTRAINT "StructureTypologie_structureMillesimeId_fkey";

-- DropIndex
DROP INDEX "Budget_structureMillesimeId_key";

-- DropIndex
DROP INDEX "StructureTypologie_structureMillesimeId_key";

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "structureMillesimeId";

-- AlterTable
ALTER TABLE "FileUpload" DROP COLUMN "category",
DROP COLUMN "categoryName",
DROP COLUMN "cpomId",
DROP COLUMN "date",
DROP COLUMN "endDate",
DROP COLUMN "granularity",
DROP COLUMN "parentFileUploadId",
DROP COLUMN "startDate",
DROP COLUMN "structureDnaCode";

-- AlterTable
ALTER TABLE "StructureMillesime" DROP COLUMN "budgetId",
DROP COLUMN "structureTypologieId";

-- AlterTable
ALTER TABLE "StructureTypologie" DROP COLUMN "structureMillesimeId";

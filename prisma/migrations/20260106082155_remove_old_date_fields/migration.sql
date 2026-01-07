/*
  Warnings:

  - You are about to drop the column `date` on the `AdresseTypologie` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `debutCpom` on the `Cpom` table. All the data in the column will be lost.
  - You are about to drop the column `finCpom` on the `Cpom` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `CpomMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `dateDebut` on the `CpomStructure` table. All the data in the column will be lost.
  - You are about to drop the column `dateFin` on the `CpomStructure` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `StructureMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `StructureTypologie` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Budget_structureDnaCode_date_key";

-- DropIndex
DROP INDEX "CpomMillesime_cpomId_date_key";

-- DropIndex
DROP INDEX "StructureMillesime_structureDnaCode_date_key";

-- DropIndex
DROP INDEX "StructureTypologie_structureDnaCode_date_key";

-- AlterTable
ALTER TABLE "AdresseTypologie" DROP COLUMN "date",
ALTER COLUMN "year" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "date";

-- AlterTable
ALTER TABLE "Cpom" DROP COLUMN "debutCpom",
DROP COLUMN "finCpom",
ALTER COLUMN "yearEnd" DROP DEFAULT,
ALTER COLUMN "yearStart" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CpomMillesime" DROP COLUMN "date",
ALTER COLUMN "year" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CpomStructure" DROP COLUMN "dateDebut",
DROP COLUMN "dateFin";

-- AlterTable
ALTER TABLE "StructureMillesime" DROP COLUMN "date",
ALTER COLUMN "year" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StructureTypologie" DROP COLUMN "date",
ALTER COLUMN "year" DROP DEFAULT;

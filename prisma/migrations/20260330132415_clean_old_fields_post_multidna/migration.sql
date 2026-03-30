/*
  Warnings:

  - You are about to drop the column `structureDnaCode` on the `ActeAdministratif` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `Activite` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `Adresse` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `structureCodeDna` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `Controle` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `DocumentFinancier` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `EvenementIndesirableGrave` table. All the data in the column will be lost.
  - You are about to drop the column `structureCodeDna` on the `Form` table. All the data in the column will be lost.
  - You are about to drop the column `activeInOfiiFileSince` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `dnaCode` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `finessCode` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `inactiveInOfiiFileSince` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `StructureMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `structureDnaCode` on the `StructureTypologie` table. All the data in the column will be lost.
  - Made the column `codeBhasile` on table `Structure` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Structure_dnaCode_key";

-- AlterTable
ALTER TABLE "ActeAdministratif" DROP COLUMN "structureDnaCode";

-- AlterTable
ALTER TABLE "Activite" DROP COLUMN "structureDnaCode";

-- AlterTable
ALTER TABLE "Adresse" DROP COLUMN "structureDnaCode";

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "structureDnaCode";

-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "structureCodeDna";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "structureDnaCode";

-- AlterTable
ALTER TABLE "Controle" DROP COLUMN "structureDnaCode";

-- AlterTable
ALTER TABLE "DocumentFinancier" DROP COLUMN "structureDnaCode";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "structureDnaCode";

-- AlterTable
ALTER TABLE "EvenementIndesirableGrave" DROP COLUMN "structureDnaCode";

-- AlterTable
ALTER TABLE "Form" DROP COLUMN "structureCodeDna";

-- AlterTable
ALTER TABLE "Structure" DROP COLUMN "activeInOfiiFileSince",
DROP COLUMN "dnaCode",
DROP COLUMN "finessCode",
DROP COLUMN "inactiveInOfiiFileSince",
ALTER COLUMN "codeBhasile" SET NOT NULL;

-- AlterTable
ALTER TABLE "StructureMillesime" DROP COLUMN "structureDnaCode";

-- AlterTable
ALTER TABLE "StructureTypologie" DROP COLUMN "structureDnaCode";

/*
  Warnings:

  - You are about to drop the column `type` on the `Contact` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[structureId,date]` on the table `Activite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[structureId,year]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[structureId,formDefinitionId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codeBhasile]` on the table `Structure` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[structureId,year]` on the table `StructureMillesime` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[structureId,year]` on the table `StructureTypologie` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ActeAdministratif" DROP CONSTRAINT "ActeAdministratif_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Activite" DROP CONSTRAINT "Activite_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Adresse" DROP CONSTRAINT "Adresse_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_structureCodeDna_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Controle" DROP CONSTRAINT "Controle_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "DocumentFinancier" DROP CONSTRAINT "DocumentFinancier_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "EvenementIndesirableGrave" DROP CONSTRAINT "EvenementIndesirableGrave_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_structureCodeDna_fkey";

-- DropForeignKey
ALTER TABLE "StructureMillesime" DROP CONSTRAINT "StructureMillesime_structureDnaCode_fkey";

-- DropForeignKey
ALTER TABLE "StructureTypologie" DROP CONSTRAINT "StructureTypologie_structureDnaCode_fkey";

-- DropIndex
DROP INDEX "Activite_structureDnaCode_date_key";

-- DropIndex
DROP INDEX "Budget_structureDnaCode_year_key";

-- DropIndex
DROP INDEX "Contact_structureDnaCode_type_key";

-- DropIndex
DROP INDEX "Form_structureCodeDna_formDefinitionId_key";

-- DropIndex
DROP INDEX "StructureMillesime_structureDnaCode_year_key";

-- DropIndex
DROP INDEX "StructureTypologie_structureDnaCode_year_key";

-- AlterTable
ALTER TABLE "ActeAdministratif" ADD COLUMN     "structureId" INTEGER;

-- AlterTable
ALTER TABLE "Activite" ADD COLUMN     "dnaCode" TEXT,
ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Adresse" ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureCodeDna" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "type",
ADD COLUMN     "perimetre" TEXT,
ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Controle" ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DocumentFinancier" ADD COLUMN     "structureId" INTEGER;

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EvenementIndesirableGrave" ADD COLUMN     "dnaCode" TEXT,
ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureCodeDna" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Structure" ADD COLUMN     "codeBhasile" TEXT,
ALTER COLUMN "dnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StructureMillesime" ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StructureTypologie" ADD COLUMN     "structureId" INTEGER,
ALTER COLUMN "structureDnaCode" DROP NOT NULL;

-- DropEnum
DROP TYPE "ContactType";

-- CreateTable
CREATE TABLE "Dna" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DnaStructure" (
    "id" SERIAL NOT NULL,
    "dnaId" INTEGER NOT NULL,
    "structureId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DnaStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Antenne" (
    "id" SERIAL NOT NULL,
    "structureId" INTEGER NOT NULL,
    "name" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "commune" TEXT,
    "departement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Antenne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finess" (
    "id" SERIAL NOT NULL,
    "structureId" INTEGER NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dna_code_key" ON "Dna"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Finess_code_key" ON "Finess"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Activite_structureId_date_key" ON "Activite"("structureId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_structureId_year_key" ON "Budget"("structureId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Form_structureId_formDefinitionId_key" ON "Form"("structureId", "formDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "Structure_codeBhasile_key" ON "Structure"("codeBhasile");

-- CreateIndex
CREATE UNIQUE INDEX "StructureMillesime_structureId_year_key" ON "StructureMillesime"("structureId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "StructureTypologie_structureId_year_key" ON "StructureTypologie"("structureId", "year");

-- AddForeignKey
ALTER TABLE "DnaStructure" ADD CONSTRAINT "DnaStructure_dnaId_fkey" FOREIGN KEY ("dnaId") REFERENCES "Dna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DnaStructure" ADD CONSTRAINT "DnaStructure_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Controle" ADD CONSTRAINT "Controle_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementIndesirableGrave" ADD CONSTRAINT "EvenementIndesirableGrave_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementIndesirableGrave" ADD CONSTRAINT "EvenementIndesirableGrave_dnaCode_fkey" FOREIGN KEY ("dnaCode") REFERENCES "Dna"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adresse" ADD CONSTRAINT "Adresse_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureMillesime" ADD CONSTRAINT "StructureMillesime_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureTypologie" ADD CONSTRAINT "StructureTypologie_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activite" ADD CONSTRAINT "Activite_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activite" ADD CONSTRAINT "Activite_dnaCode_fkey" FOREIGN KEY ("dnaCode") REFERENCES "Dna"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActeAdministratif" ADD CONSTRAINT "ActeAdministratif_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFinancier" ADD CONSTRAINT "DocumentFinancier_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antenne" ADD CONSTRAINT "Antenne_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finess" ADD CONSTRAINT "Finess_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

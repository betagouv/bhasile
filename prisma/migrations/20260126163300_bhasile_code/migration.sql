/*
  Warnings:

  - You are about to drop the column `type` on the `Contact` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codeBhasile]` on the table `Structure` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Contact_structureDnaCode_type_key";

-- AlterTable
ALTER TABLE "Activite" ADD COLUMN     "dnaCode" TEXT;

-- AlterTable
ALTER TABLE "Adresse" ADD COLUMN     "structureCodeBhasile" TEXT;

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "structureCodeBhasile" TEXT;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "structureCodeBhasile" TEXT;

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "type",
ADD COLUMN     "structureCodeBhasile" TEXT;

-- AlterTable
ALTER TABLE "Controle" ADD COLUMN     "structureCodeBhasile" TEXT;

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "structureCodeBhasile" TEXT;

-- AlterTable
ALTER TABLE "EvenementIndesirableGrave" ADD COLUMN     "structureCodeBhasile" TEXT;

-- AlterTable
ALTER TABLE "FileUpload" ADD COLUMN     "structureCodeBhasile" TEXT;

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "structureCodeBhasile" TEXT;

-- AlterTable
ALTER TABLE "Structure" ADD COLUMN     "codeBhasile" TEXT;

-- AlterTable
ALTER TABLE "StructureMillesime" ADD COLUMN     "structureCodeBhasile" TEXT;

-- AlterTable
ALTER TABLE "StructureTypologie" ADD COLUMN     "structureCodeBhasile" TEXT;

-- DropEnum
DROP TYPE "ContactType";

-- CreateTable
CREATE TABLE "Dna" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "granularity" TEXT,
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
    "structureCodeBhasile" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Antenne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finess" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "granularity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dna_code_key" ON "Dna"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Antenne_structureCodeBhasile_key" ON "Antenne"("structureCodeBhasile");

-- CreateIndex
CREATE UNIQUE INDEX "Finess_code_key" ON "Finess"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Structure_codeBhasile_key" ON "Structure"("codeBhasile");

-- AddForeignKey
ALTER TABLE "DnaStructure" ADD CONSTRAINT "DnaStructure_dnaId_fkey" FOREIGN KEY ("dnaId") REFERENCES "Dna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DnaStructure" ADD CONSTRAINT "DnaStructure_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activite" ADD CONSTRAINT "Activite_dnaCode_fkey" FOREIGN KEY ("dnaCode") REFERENCES "Dna"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antenne" ADD CONSTRAINT "Antenne_structureCodeBhasile_fkey" FOREIGN KEY ("structureCodeBhasile") REFERENCES "Structure"("codeBhasile") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[transformationId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[structureVersionTransformationId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transformationId,formDefinitionId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[structureVersionTransformationId]` on the table `StructureVersion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransformationType" AS ENUM ('OUVERTURE_EX_NIHILO', 'OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES', 'EXTENSION_EX_NIHILO', 'EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT', 'EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT', 'CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE', 'CONTRACTION_SANS_TRANSFERT_DE_PLACES', 'FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES', 'FERMETURE_SANS_TRANSFERT', 'TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR', 'TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR', 'TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES');

-- CreateEnum
CREATE TYPE "StructureVersionTransformationType" AS ENUM ('CREATION', 'FERMETURE', 'CONTRACTION', 'EXTENSION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActeAdministratifCategory" ADD VALUE 'ARRETE_FUSION';
ALTER TYPE "ActeAdministratifCategory" ADD VALUE 'ARRETE_EXTENSION';
ALTER TYPE "ActeAdministratifCategory" ADD VALUE 'ARRETE_CONTRACTION';

-- AlterTable
ALTER TABLE "ActeAdministratif" ADD COLUMN     "structureVersionTransformationId" INTEGER;

-- AlterTable
ALTER TABLE "Antenne" ALTER COLUMN "structureId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DnaStructure" ALTER COLUMN "structureId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Finess" ALTER COLUMN "structureId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "structureVersionTransformationId" INTEGER,
ADD COLUMN     "transformationId" INTEGER;

-- AlterTable
ALTER TABLE "StructureVersion" ADD COLUMN     "structureVersionTransformationId" INTEGER,
ALTER COLUMN "structureId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Transformation" (
    "id" SERIAL NOT NULL,
    "type" "TransformationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructureVersionTransformation" (
    "id" SERIAL NOT NULL,
    "transformationId" INTEGER NOT NULL,
    "type" "StructureVersionTransformationType" NOT NULL,
    "motif" TEXT,
    "operateurId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StructureVersionTransformation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Form_transformationId_key" ON "Form"("transformationId");

-- CreateIndex
CREATE UNIQUE INDEX "Form_structureVersionTransformationId_key" ON "Form"("structureVersionTransformationId");

-- CreateIndex
CREATE UNIQUE INDEX "Form_transformationId_formDefinitionId_key" ON "Form"("transformationId", "formDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "StructureVersion_structureVersionTransformationId_key" ON "StructureVersion"("structureVersionTransformationId");

-- AddForeignKey
ALTER TABLE "ActeAdministratif" ADD CONSTRAINT "ActeAdministratif_structureVersionTransformationId_fkey" FOREIGN KEY ("structureVersionTransformationId") REFERENCES "StructureVersionTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_transformationId_fkey" FOREIGN KEY ("transformationId") REFERENCES "Transformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_structureVersionTransformationId_fkey" FOREIGN KEY ("structureVersionTransformationId") REFERENCES "StructureVersionTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureVersion" ADD CONSTRAINT "StructureVersion_structureVersionTransformationId_fkey" FOREIGN KEY ("structureVersionTransformationId") REFERENCES "StructureVersionTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureVersionTransformation" ADD CONSTRAINT "StructureVersionTransformation_transformationId_fkey" FOREIGN KEY ("transformationId") REFERENCES "Transformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureVersionTransformation" ADD CONSTRAINT "StructureVersionTransformation_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

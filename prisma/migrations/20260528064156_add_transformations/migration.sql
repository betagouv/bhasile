/*
  Warnings:

  - A unique constraint covering the columns `[transformationId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transformationId,formDefinitionId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[structureTransformationId,formDefinitionId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[structureTransformationId]` on the table `StructureVersion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransformationType" AS ENUM ('OUVERTURE_EX_NIHILO', 'OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES', 'EXTENSION_EX_NIHILO', 'EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT', 'EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT', 'CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE', 'CONTRACTION_SANS_TRANSFERT_DE_PLACES', 'FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES', 'FERMETURE_SANS_TRANSFERT', 'TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR', 'TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR', 'TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES');

-- CreateEnum
CREATE TYPE "StructureTransformationType" AS ENUM ('CREATION', 'FERMETURE', 'CONTRACTION', 'EXTENSION');

-- AlterTable
ALTER TABLE "ActeAdministratif" ADD COLUMN     "structureTransformationId" INTEGER;

-- AlterTable
ALTER TABLE "Antenne" ALTER COLUMN "structureId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DnaStructure" ALTER COLUMN "structureId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Finess" ALTER COLUMN "structureId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "structureTransformationId" INTEGER,
ADD COLUMN     "transformationId" INTEGER;

-- AlterTable
ALTER TABLE "StructureVersion" ADD COLUMN     "structureTransformationId" INTEGER,
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
CREATE TABLE "StructureTransformation" (
    "id" SERIAL NOT NULL,
    "transformationId" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "type" "StructureTransformationType" NOT NULL,
    "motif" TEXT,
    "operateurId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StructureTransformation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Form_transformationId_key" ON "Form"("transformationId");

-- CreateIndex
CREATE UNIQUE INDEX "Form_transformationId_formDefinitionId_key" ON "Form"("transformationId", "formDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "Form_structureTransformationId_formDefinitionId_key" ON "Form"("structureTransformationId", "formDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "StructureVersion_structureTransformationId_key" ON "StructureVersion"("structureTransformationId");

-- AddForeignKey
ALTER TABLE "ActeAdministratif" ADD CONSTRAINT "ActeAdministratif_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_transformationId_fkey" FOREIGN KEY ("transformationId") REFERENCES "Transformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureVersion" ADD CONSTRAINT "StructureVersion_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureTransformation" ADD CONSTRAINT "StructureTransformation_transformationId_fkey" FOREIGN KEY ("transformationId") REFERENCES "Transformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureTransformation" ADD CONSTRAINT "StructureTransformation_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

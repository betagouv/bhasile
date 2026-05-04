/*
  Warnings:

  - A unique constraint covering the columns `[transformationId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transformationId,formDefinitionId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[structureTransformationId,year]` on the table `StructureMillesime` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[structureTransformationId,year]` on the table `StructureTypologie` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransformationType" AS ENUM ('OUVERTURE_EX_NIHILO', 'OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES', 'EXTENSION_FROM_SCRATCH', 'EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT', 'EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT', 'CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE', 'CONTRACTION_SANS_TRANSFERT_DE_PLACES', 'FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES', 'FERMETURE_SANS_TRANSFERT', 'TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR', 'TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR', 'TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES');

-- CreateEnum
CREATE TYPE "StructureTransformationType" AS ENUM ('CREATION', 'FERMETURE', 'CONTRACTION', 'EXTENSION');

-- AlterTable
ALTER TABLE "Adresse" ADD COLUMN     "structureTransformationId" INTEGER;

-- AlterTable
ALTER TABLE "Antenne" ADD COLUMN     "structureTransformationId" INTEGER,
ALTER COLUMN "structureId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "structureTransformationId" INTEGER;

-- AlterTable
ALTER TABLE "Finess" ADD COLUMN     "structureTransformationId" INTEGER,
ALTER COLUMN "structureId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "transformationId" INTEGER;

-- AlterTable
ALTER TABLE "Structure" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "StructureMillesime" ADD COLUMN     "structureTransformationId" INTEGER;

-- AlterTable
ALTER TABLE "StructureTypologie" ADD COLUMN     "structureTransformationId" INTEGER;

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
    "structureId" INTEGER NOT NULL,
    "transformationId" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "type" "StructureTransformationType" NOT NULL,
    "motif" TEXT,
    "public" "PublicType",
    "adresseAdministrative" TEXT,
    "codePostalAdministratif" TEXT,
    "communeAdministrative" TEXT,
    "departementAdministratif" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "nom" TEXT,
    "placesAutorisees" INTEGER,
    "pmr" INTEGER,
    "lgbt" INTEGER,
    "fvvTeh" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StructureTransformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DnaStructureTransformation" (
    "id" SERIAL NOT NULL,
    "dnaId" INTEGER NOT NULL,
    "structureTransformationId" INTEGER NOT NULL,

    CONSTRAINT "DnaStructureTransformation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Form_transformationId_key" ON "Form"("transformationId");

-- CreateIndex
CREATE UNIQUE INDEX "Form_transformationId_formDefinitionId_key" ON "Form"("transformationId", "formDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "StructureMillesime_structureTransformationId_year_key" ON "StructureMillesime"("structureTransformationId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "StructureTypologie_structureTransformationId_year_key" ON "StructureTypologie"("structureTransformationId", "year");

-- AddForeignKey
ALTER TABLE "Adresse" ADD CONSTRAINT "Adresse_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antenne" ADD CONSTRAINT "Antenne_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finess" ADD CONSTRAINT "Finess_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_transformationId_fkey" FOREIGN KEY ("transformationId") REFERENCES "Transformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureMillesime" ADD CONSTRAINT "StructureMillesime_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureTypologie" ADD CONSTRAINT "StructureTypologie_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureTransformation" ADD CONSTRAINT "StructureTransformation_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureTransformation" ADD CONSTRAINT "StructureTransformation_transformationId_fkey" FOREIGN KEY ("transformationId") REFERENCES "Transformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DnaStructureTransformation" ADD CONSTRAINT "DnaStructureTransformation_dnaId_fkey" FOREIGN KEY ("dnaId") REFERENCES "Dna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DnaStructureTransformation" ADD CONSTRAINT "DnaStructureTransformation_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "DocumentFinancierCategory" AS ENUM ('BUDGET_PREVISIONNEL_DEMANDE', 'RAPPORT_BUDGETAIRE', 'BUDGET_PREVISIONNEL_RETENU', 'BUDGET_RECTIFICATIF', 'COMPTE_ADMINISTRATIF_SOUMIS', 'RAPPORT_ACTIVITE', 'COMPTE_ADMINISTRATIF_RETENU', 'DEMANDE_SUBVENTION', 'COMPTE_RENDU_FINANCIER', 'RAPPORT_ACTIVITE_OPERATEUR', 'AUTRE_FINANCIER');

-- CreateEnum
CREATE TYPE "ActeAdministratifCategory" AS ENUM ('ARRETE_AUTORISATION', 'CONVENTION', 'ARRETE_TARIFICATION', 'CPOM', 'INSPECTION_CONTROLE', 'EVALUATION', 'AUTRE');

-- CreateEnum
CREATE TYPE "DocumentFinancierGranularity" AS ENUM ('STRUCTURE', 'CPOM', 'STRUCTURE_ET_CPOM');

-- AlterTable
ALTER TABLE "FileUpload" ADD COLUMN     "acteAdministratifId" INTEGER,
ADD COLUMN     "documentFinancierId" INTEGER,
ALTER COLUMN "granularity" DROP NOT NULL,
ALTER COLUMN "granularity" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ActeAdministratif" (
    "id" SERIAL NOT NULL,
    "structureDnaCode" TEXT,
    "cpomId" INTEGER,
    "category" "ActeAdministratifCategory",
    "date" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "name" TEXT,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActeAdministratif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentFinancier" (
    "id" SERIAL NOT NULL,
    "structureDnaCode" TEXT,
    "category" "DocumentFinancierCategory",
    "year" INTEGER NOT NULL,
    "name" TEXT,
    "granularity" "DocumentFinancierGranularity" NOT NULL DEFAULT 'STRUCTURE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentFinancier_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_acteAdministratifId_fkey" FOREIGN KEY ("acteAdministratifId") REFERENCES "ActeAdministratif"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_documentFinancierId_fkey" FOREIGN KEY ("documentFinancierId") REFERENCES "DocumentFinancier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActeAdministratif" ADD CONSTRAINT "ActeAdministratif_structureDnaCode_fkey" FOREIGN KEY ("structureDnaCode") REFERENCES "Structure"("dnaCode") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActeAdministratif" ADD CONSTRAINT "ActeAdministratif_cpomId_fkey" FOREIGN KEY ("cpomId") REFERENCES "Cpom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActeAdministratif" ADD CONSTRAINT "ActeAdministratif_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ActeAdministratif"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFinancier" ADD CONSTRAINT "DocumentFinancier_structureDnaCode_fkey" FOREIGN KEY ("structureDnaCode") REFERENCES "Structure"("dnaCode") ON DELETE CASCADE ON UPDATE CASCADE;

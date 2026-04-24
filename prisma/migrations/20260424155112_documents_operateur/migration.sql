-- CreateEnum
CREATE TYPE "DocumentOperateurCategory" AS ENUM ('RAPPORT_ACTIVITE', 'FRAIS_DE_SIEGE', 'STATUTS', 'AUTRE');

-- AlterTable
ALTER TABLE "FileUpload" ADD COLUMN     "documentOperateurId" INTEGER;

-- CreateTable
CREATE TABLE "DocumentOperateur" (
    "id" SERIAL NOT NULL,
    "category" "DocumentOperateurCategory" NOT NULL,
    "date" TIMESTAMP(3),
    "name" TEXT,
    "operateurId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentOperateur_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_documentOperateurId_fkey" FOREIGN KEY ("documentOperateurId") REFERENCES "DocumentOperateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentOperateur" ADD CONSTRAINT "DocumentOperateur_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

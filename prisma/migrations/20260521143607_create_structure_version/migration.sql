/*
  Warnings:

  - A unique constraint covering the columns `[structureVersionId,year]` on the table `StructureTypologie` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Adresse" ADD COLUMN     "logementSocial" INTEGER,
ADD COLUMN     "placesAutorisees" INTEGER,
ADD COLUMN     "qpv" INTEGER,
ADD COLUMN     "structureVersionId" INTEGER;

-- AlterTable
ALTER TABLE "Antenne" ADD COLUMN     "structureVersionId" INTEGER;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "structureVersionId" INTEGER;

-- AlterTable
ALTER TABLE "DnaStructure" ADD COLUMN     "structureVersionId" INTEGER;

-- AlterTable
ALTER TABLE "Finess" ADD COLUMN     "structureVersionId" INTEGER;

-- AlterTable
ALTER TABLE "StructureTypologie" ADD COLUMN     "structureVersionId" INTEGER;

-- CreateTable
CREATE TABLE "StructureVersion" (
    "id" SERIAL NOT NULL,
    "structureId" INTEGER NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "forceHistorize" BOOLEAN NOT NULL DEFAULT false,
    "type" "StructureType",
    "adresseAdministrative" TEXT,
    "codePostalAdministratif" TEXT,
    "communeAdministrative" TEXT,
    "departementAdministratif" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "nom" TEXT,
    "creationDate" TIMESTAMP(3),
    "date303" TIMESTAMP(3),
    "lgbt" BOOLEAN,
    "fvvTeh" BOOLEAN,
    "public" "PublicType",
    "notes" TEXT,
    "nomOfii" TEXT,
    "directionTerritoriale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StructureVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StructureVersion_structureId_effectiveDate_idx" ON "StructureVersion"("structureId", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "StructureTypologie_structureVersionId_year_key" ON "StructureTypologie"("structureVersionId", "year");

-- AddForeignKey
ALTER TABLE "Adresse" ADD CONSTRAINT "Adresse_structureVersionId_fkey" FOREIGN KEY ("structureVersionId") REFERENCES "StructureVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_structureVersionId_fkey" FOREIGN KEY ("structureVersionId") REFERENCES "StructureVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DnaStructure" ADD CONSTRAINT "DnaStructure_structureVersionId_fkey" FOREIGN KEY ("structureVersionId") REFERENCES "StructureVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antenne" ADD CONSTRAINT "Antenne_structureVersionId_fkey" FOREIGN KEY ("structureVersionId") REFERENCES "StructureVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finess" ADD CONSTRAINT "Finess_structureVersionId_fkey" FOREIGN KEY ("structureVersionId") REFERENCES "StructureVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureVersion" ADD CONSTRAINT "StructureVersion_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureVersion" ADD CONSTRAINT "StructureVersion_departementAdministratif_fkey" FOREIGN KEY ("departementAdministratif") REFERENCES "Departement"("numero") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureTypologie" ADD CONSTRAINT "StructureTypologie_structureVersionId_fkey" FOREIGN KEY ("structureVersionId") REFERENCES "StructureVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

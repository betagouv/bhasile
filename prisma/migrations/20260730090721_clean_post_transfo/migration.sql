/*
  Warnings:

  - You are about to drop the column `structureId` on the `Adresse` table. All the data in the column will be lost.
  - You are about to drop the column `structureId` on the `Antenne` table. All the data in the column will be lost.
  - You are about to drop the column `structureId` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Dna` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `DnaStructure` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `DnaStructure` table. All the data in the column will be lost.
  - You are about to drop the column `structureId` on the `DnaStructure` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Finess` table. All the data in the column will be lost.
  - You are about to drop the column `structureId` on the `Finess` table. All the data in the column will be lost.
  - You are about to drop the column `structureVersionId` on the `Finess` table. All the data in the column will be lost.
  - You are about to drop the column `adresseAdministrative` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `codePostalAdministratif` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `communeAdministrative` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `directionTerritoriale` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `fvvTeh` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `lgbt` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `nom` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `nomOfii` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `public` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `structureId` on the `StructureFiness` table. All the data in the column will be lost.
  - You are about to drop the column `echeancePlacesACreer` on the `StructureTypologie` table. All the data in the column will be lost.
  - You are about to drop the column `echeancePlacesAFermer` on the `StructureTypologie` table. All the data in the column will be lost.
  - You are about to drop the column `placesACreer` on the `StructureTypologie` table. All the data in the column will be lost.
  - You are about to drop the column `placesAFermer` on the `StructureTypologie` table. All the data in the column will be lost.
  - You are about to drop the column `structureVersionId` on the `StructureTypologie` table. All the data in the column will be lost.
  - You are about to drop the column `yearOrigin` on the `StructureTypologie` table. All the data in the column will be lost.
  - You are about to drop the column `creationDate` on the `StructureVersion` table. All the data in the column will be lost.
  - You are about to drop the column `date303` on the `StructureVersion` table. All the data in the column will be lost.
  - You are about to drop the `AdresseTypologie` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CpomMillesime` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `departementAdministratif` on table `Dna` required. This step will fail if there are existing NULL values in that column.
  - Made the column `directionTerritoriale` on table `Dna` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nom` on table `Dna` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nomOfii` on table `Dna` required. This step will fail if there are existing NULL values in that column.
  - Made the column `operateurId` on table `Dna` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Dna` required. This step will fail if there are existing NULL values in that column.
  - Made the column `code` on table `Finess` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Adresse" DROP CONSTRAINT "Adresse_structureId_fkey";

-- DropForeignKey
ALTER TABLE "AdresseTypologie" DROP CONSTRAINT "AdresseTypologie_adresseId_fkey";

-- DropForeignKey
ALTER TABLE "Antenne" DROP CONSTRAINT "Antenne_structureId_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_structureId_fkey";

-- DropForeignKey
ALTER TABLE "Dna" DROP CONSTRAINT "Dna_departementAdministratif_fkey";

-- DropForeignKey
ALTER TABLE "Dna" DROP CONSTRAINT "Dna_operateurId_fkey";

-- DropForeignKey
ALTER TABLE "DnaStructure" DROP CONSTRAINT "DnaStructure_structureId_fkey";

-- DropForeignKey
ALTER TABLE "Finess" DROP CONSTRAINT "Finess_structureId_fkey";

-- DropForeignKey
ALTER TABLE "Finess" DROP CONSTRAINT "Finess_structureVersionId_fkey";

-- DropForeignKey
ALTER TABLE "StructureFiness" DROP CONSTRAINT "StructureFiness_structureId_fkey";

-- DropForeignKey
ALTER TABLE "StructureTypologie" DROP CONSTRAINT "StructureTypologie_structureVersionId_fkey";

-- DropIndex
DROP INDEX "DnaStructure_structureId_dnaId_key";

-- DropIndex
DROP INDEX "StructureFiness_structureId_finessId_key";

-- AlterTable
ALTER TABLE "Adresse" DROP COLUMN "structureId";

-- AlterTable
ALTER TABLE "Antenne" DROP COLUMN "structureId";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "structureId";

-- AlterTable
ALTER TABLE "Dna" DROP COLUMN "description",
ALTER COLUMN "departementAdministratif" SET NOT NULL,
ALTER COLUMN "directionTerritoriale" SET NOT NULL,
ALTER COLUMN "nom" SET NOT NULL,
ALTER COLUMN "nomOfii" SET NOT NULL,
ALTER COLUMN "operateurId" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "DnaStructure" DROP COLUMN "endDate",
DROP COLUMN "startDate",
DROP COLUMN "structureId";

-- AlterTable
ALTER TABLE "Finess" DROP COLUMN "description",
DROP COLUMN "structureId",
DROP COLUMN "structureVersionId",
ALTER COLUMN "code" SET NOT NULL;

-- AlterTable
ALTER TABLE "Structure" DROP COLUMN "adresseAdministrative",
DROP COLUMN "codePostalAdministratif",
DROP COLUMN "communeAdministrative",
DROP COLUMN "directionTerritoriale",
DROP COLUMN "fvvTeh",
DROP COLUMN "latitude",
DROP COLUMN "lgbt",
DROP COLUMN "longitude",
DROP COLUMN "nom",
DROP COLUMN "nomOfii",
DROP COLUMN "notes",
DROP COLUMN "public";

-- AlterTable
ALTER TABLE "StructureFiness" DROP COLUMN "structureId";

-- AlterTable
ALTER TABLE "StructureTypologie" DROP COLUMN "echeancePlacesACreer",
DROP COLUMN "echeancePlacesAFermer",
DROP COLUMN "placesACreer",
DROP COLUMN "placesAFermer",
DROP COLUMN "structureVersionId",
DROP COLUMN "yearOrigin";

-- AlterTable
ALTER TABLE "StructureVersion" DROP COLUMN "creationDate",
DROP COLUMN "date303";

-- DropTable
DROP TABLE "AdresseTypologie";

-- DropTable
DROP TABLE "CpomMillesime";

-- AddForeignKey
ALTER TABLE "Dna" ADD CONSTRAINT "Dna_departementAdministratif_fkey" FOREIGN KEY ("departementAdministratif") REFERENCES "Departement"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dna" ADD CONSTRAINT "Dna_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

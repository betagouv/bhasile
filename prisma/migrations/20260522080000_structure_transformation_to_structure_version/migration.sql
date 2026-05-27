-- DropForeignKey
ALTER TABLE "Adresse" DROP CONSTRAINT "Adresse_structureTransformationId_fkey";

-- DropForeignKey
ALTER TABLE "Antenne" DROP CONSTRAINT "Antenne_structureTransformationId_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_structureTransformationId_fkey";

-- DropForeignKey
ALTER TABLE "DnaStructureTransformation" DROP CONSTRAINT "DnaStructureTransformation_dnaId_fkey";

-- DropForeignKey
ALTER TABLE "DnaStructureTransformation" DROP CONSTRAINT "DnaStructureTransformation_structureTransformationId_fkey";

-- DropForeignKey
ALTER TABLE "Finess" DROP CONSTRAINT "Finess_structureTransformationId_fkey";

-- DropForeignKey
ALTER TABLE "StructureMillesime" DROP CONSTRAINT "StructureMillesime_structureTransformationId_fkey";

-- DropForeignKey
ALTER TABLE "StructureTransformation" DROP CONSTRAINT "StructureTransformation_structureId_fkey";

-- DropForeignKey
ALTER TABLE "StructureTypologie" DROP CONSTRAINT "StructureTypologie_structureTransformationId_fkey";

-- DropIndex
DROP INDEX "StructureMillesime_structureTransformationId_year_key";

-- DropIndex
DROP INDEX "StructureTypologie_structureTransformationId_year_key";

-- AlterTable
ALTER TABLE "Adresse" DROP COLUMN "structureTransformationId";

-- AlterTable
ALTER TABLE "Antenne" DROP COLUMN "structureTransformationId";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "structureTransformationId";

-- AlterTable
ALTER TABLE "DnaStructure" ALTER COLUMN "structureId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Finess" DROP COLUMN "structureTransformationId";

-- AlterTable
ALTER TABLE "Structure" DROP COLUMN "isArchived";

-- AlterTable
ALTER TABLE "StructureMillesime" DROP COLUMN "structureTransformationId";

-- AlterTable
ALTER TABLE "StructureTransformation" DROP COLUMN "adresseAdministrative",
DROP COLUMN "codePostalAdministratif",
DROP COLUMN "communeAdministrative",
DROP COLUMN "departementAdministratif",
DROP COLUMN "fvvTeh",
DROP COLUMN "lgbt",
DROP COLUMN "nom",
DROP COLUMN "placesAutorisees",
DROP COLUMN "pmr",
DROP COLUMN "public",
DROP COLUMN "structureId",
DROP COLUMN "structureTransformationDate",
DROP COLUMN "structureTransformationMotif",
DROP COLUMN "structureTransformationType",
ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "motif" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "StructureTransformationType" NOT NULL;

-- AlterTable
ALTER TABLE "StructureTypologie" DROP COLUMN "structureTransformationId";

-- AlterTable
ALTER TABLE "StructureVersion" ADD COLUMN     "structureTransformationId" INTEGER,
ALTER COLUMN "structureId" DROP NOT NULL;

-- DropTable
DROP TABLE "DnaStructureTransformation";

-- CreateIndex
CREATE UNIQUE INDEX "StructureVersion_structureTransformationId_key" ON "StructureVersion"("structureTransformationId");

-- AddForeignKey
ALTER TABLE "StructureVersion" ADD CONSTRAINT "StructureVersion_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

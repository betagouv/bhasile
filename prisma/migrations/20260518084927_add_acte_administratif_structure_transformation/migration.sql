/*
  Warnings:

  - You are about to drop the column `date` on the `StructureTransformation` table. All the data in the column will be lost.
  - You are about to drop the column `motif` on the `StructureTransformation` table. All the data in the column will be lost.
  - The `type` column on the `StructureTransformation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `structureTransformationType` to the `StructureTransformation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Antenne" DROP CONSTRAINT "Antenne_structureTransformationId_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_structureTransformationId_fkey";

-- AlterTable
ALTER TABLE "ActeAdministratif" ADD COLUMN     "structureTransformationId" INTEGER;

-- AlterTable
ALTER TABLE "StructureTransformation" DROP COLUMN "date",
DROP COLUMN "motif",
ADD COLUMN     "structureTransformationDate" TIMESTAMP(3),
ADD COLUMN     "structureTransformationMotif" TEXT,
ADD COLUMN     "structureTransformationType" "StructureTransformationType" NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "StructureType";

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antenne" ADD CONSTRAINT "Antenne_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActeAdministratif" ADD CONSTRAINT "ActeAdministratif_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

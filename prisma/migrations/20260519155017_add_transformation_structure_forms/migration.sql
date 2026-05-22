/*
  Warnings:

  - A unique constraint covering the columns `[structureTransformationId,formDefinitionId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Antenne" DROP CONSTRAINT "Antenne_structureTransformationId_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_structureTransformationId_fkey";

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "structureTransformationId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Form_structureTransformationId_formDefinitionId_key" ON "Form"("structureTransformationId", "formDefinitionId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antenne" ADD CONSTRAINT "Antenne_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

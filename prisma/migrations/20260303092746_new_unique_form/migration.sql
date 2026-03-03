/*
  Warnings:

  - A unique constraint covering the columns `[structureId,formDefinitionId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Form_structureCodeDna_formDefinitionId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Form_structureId_formDefinitionId_key" ON "Form"("structureId", "formDefinitionId");

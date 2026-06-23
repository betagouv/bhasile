/*
  Warnings:

  - A unique constraint covering the columns `[structureId,dnaId]` on the table `DnaStructure` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[structureVersionId,dnaId]` on the table `DnaStructure` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DnaStructure" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "StructureFiness" (
    "id" SERIAL NOT NULL,
    "finessId" INTEGER NOT NULL,
    "structureId" INTEGER,
    "structureVersionId" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StructureFiness_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StructureFiness_structureId_finessId_key" ON "StructureFiness"("structureId", "finessId");

-- CreateIndex
CREATE UNIQUE INDEX "StructureFiness_structureVersionId_finessId_key" ON "StructureFiness"("structureVersionId", "finessId");

-- CreateIndex
CREATE UNIQUE INDEX "DnaStructure_structureId_dnaId_key" ON "DnaStructure"("structureId", "dnaId");

-- CreateIndex
CREATE UNIQUE INDEX "DnaStructure_structureVersionId_dnaId_key" ON "DnaStructure"("structureVersionId", "dnaId");

-- AddForeignKey
ALTER TABLE "StructureFiness" ADD CONSTRAINT "StructureFiness_finessId_fkey" FOREIGN KEY ("finessId") REFERENCES "Finess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureFiness" ADD CONSTRAINT "StructureFiness_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureFiness" ADD CONSTRAINT "StructureFiness_structureVersionId_fkey" FOREIGN KEY ("structureVersionId") REFERENCES "StructureVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "StructureFiness" ADD CONSTRAINT "StructureFiness_finessId_fkey" FOREIGN KEY ("finessId") REFERENCES "Finess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureFiness" ADD CONSTRAINT "StructureFiness_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureFiness" ADD CONSTRAINT "StructureFiness_structureVersionId_fkey" FOREIGN KEY ("structureVersionId") REFERENCES "StructureVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable : description du lien DNA portée par la table de passage
ALTER TABLE "DnaStructure" ADD COLUMN "description" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DnaStructure_structureId_dnaId_key" ON "DnaStructure"("structureId", "dnaId");

-- CreateIndex
CREATE UNIQUE INDEX "DnaStructure_structureVersionId_dnaId_key" ON "DnaStructure"("structureVersionId", "dnaId");

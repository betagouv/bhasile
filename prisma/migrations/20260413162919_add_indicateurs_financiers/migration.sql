-- CreateEnum
CREATE TYPE "IndicateurFinancierType" AS ENUM ('PREVISIONNEL', 'REALISE');

-- CreateTable
CREATE TABLE "IndicateurFinancier" (
    "id" SERIAL NOT NULL,
    "structureId" INTEGER,
    "year" INTEGER NOT NULL DEFAULT 0,
    "type" "IndicateurFinancierType" NOT NULL,
    "ETP" DOUBLE PRECISION,
    "tauxEncadrement" DOUBLE PRECISION,
    "coutJournalier" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndicateurFinancier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndicateurFinancier_structureId_year_type_key" ON "IndicateurFinancier"("structureId", "year", "type");

-- AddForeignKey
ALTER TABLE "IndicateurFinancier" ADD CONSTRAINT "IndicateurFinancier_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

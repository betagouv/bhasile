-- CreateEnum
CREATE TYPE "AccessRole" AS ENUM ('VIEWER', 'EDITEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('AGENT', 'OPERATEUR');

-- DropForeignKey
ALTER TABLE "EmailPattern" DROP CONSTRAINT "EmailPattern_roleId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "UserType" NOT NULL DEFAULT 'AGENT';

-- AlterTable
ALTER TABLE "EmailPattern" ALTER COLUMN "roleId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Perimetre" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isNational" BOOLEAN NOT NULL DEFAULT false,
    "operateurId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Perimetre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerimetreRegion" (
    "perimetreId" INTEGER NOT NULL,
    "regionId" INTEGER NOT NULL,

    CONSTRAINT "PerimetreRegion_pkey" PRIMARY KEY ("perimetreId","regionId")
);

-- CreateTable
CREATE TABLE "PerimetreDepartement" (
    "perimetreId" INTEGER NOT NULL,
    "departementNumero" TEXT NOT NULL,

    CONSTRAINT "PerimetreDepartement_pkey" PRIMARY KEY ("perimetreId","departementNumero")
);

-- CreateTable
CREATE TABLE "PerimetreStructure" (
    "perimetreId" INTEGER NOT NULL,
    "structureId" INTEGER NOT NULL,

    CONSTRAINT "PerimetreStructure_pkey" PRIMARY KEY ("perimetreId","structureId")
);

-- CreateTable
CREATE TABLE "UserGrant" (
    "userId" INTEGER NOT NULL,
    "role" "AccessRole" NOT NULL,
    "perimetreId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGrant_pkey" PRIMARY KEY ("userId","role","perimetreId")
);

-- CreateTable
CREATE TABLE "EmailPatternGrant" (
    "emailPatternId" INTEGER NOT NULL,
    "role" "AccessRole" NOT NULL,
    "perimetreId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailPatternGrant_pkey" PRIMARY KEY ("emailPatternId","role","perimetreId")
);

-- CreateIndex
CREATE INDEX "Perimetre_operateurId_idx" ON "Perimetre"("operateurId");

-- CreateIndex
CREATE INDEX "PerimetreRegion_regionId_idx" ON "PerimetreRegion"("regionId");

-- CreateIndex
CREATE INDEX "PerimetreDepartement_departementNumero_idx" ON "PerimetreDepartement"("departementNumero");

-- CreateIndex
CREATE INDEX "PerimetreStructure_structureId_idx" ON "PerimetreStructure"("structureId");

-- CreateIndex
CREATE INDEX "UserGrant_perimetreId_idx" ON "UserGrant"("perimetreId");

-- CreateIndex
CREATE INDEX "EmailPatternGrant_perimetreId_idx" ON "EmailPatternGrant"("perimetreId");

-- AddForeignKey
ALTER TABLE "Perimetre" ADD CONSTRAINT "Perimetre_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerimetreRegion" ADD CONSTRAINT "PerimetreRegion_perimetreId_fkey" FOREIGN KEY ("perimetreId") REFERENCES "Perimetre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerimetreRegion" ADD CONSTRAINT "PerimetreRegion_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerimetreDepartement" ADD CONSTRAINT "PerimetreDepartement_perimetreId_fkey" FOREIGN KEY ("perimetreId") REFERENCES "Perimetre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerimetreDepartement" ADD CONSTRAINT "PerimetreDepartement_departementNumero_fkey" FOREIGN KEY ("departementNumero") REFERENCES "Departement"("numero") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerimetreStructure" ADD CONSTRAINT "PerimetreStructure_perimetreId_fkey" FOREIGN KEY ("perimetreId") REFERENCES "Perimetre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerimetreStructure" ADD CONSTRAINT "PerimetreStructure_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGrant" ADD CONSTRAINT "UserGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGrant" ADD CONSTRAINT "UserGrant_perimetreId_fkey" FOREIGN KEY ("perimetreId") REFERENCES "Perimetre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailPatternGrant" ADD CONSTRAINT "EmailPatternGrant_emailPatternId_fkey" FOREIGN KEY ("emailPatternId") REFERENCES "EmailPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailPatternGrant" ADD CONSTRAINT "EmailPatternGrant_perimetreId_fkey" FOREIGN KEY ("perimetreId") REFERENCES "Perimetre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailPattern" ADD CONSTRAINT "EmailPattern_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- CreateEnum
CREATE TYPE "AccessRole" AS ENUM ('LECTEUR', 'EDITEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "GrantScope" AS ENUM ('NATIONAL', 'REGION', 'DEPARTEMENT', 'STRUCTURE');

-- DropForeignKey
ALTER TABLE "EmailPattern" DROP CONSTRAINT "EmailPattern_roleId_fkey";

-- AlterTable
ALTER TABLE "EmailPattern" ALTER COLUMN "roleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "operateurId" INTEGER;

-- CreateTable
CREATE TABLE "Grant" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "emailPatternId" INTEGER,
    "role" "AccessRole" NOT NULL,
    "scope" "GrantScope" NOT NULL,
    "regionId" INTEGER,
    "departementNumero" TEXT,
    "structureId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Grant_userId_idx" ON "Grant"("userId");

-- CreateIndex
CREATE INDEX "Grant_emailPatternId_idx" ON "Grant"("emailPatternId");

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_emailPatternId_fkey" FOREIGN KEY ("emailPatternId") REFERENCES "EmailPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_departementNumero_fkey" FOREIGN KEY ("departementNumero") REFERENCES "Departement"("numero") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailPattern" ADD CONSTRAINT "EmailPattern_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

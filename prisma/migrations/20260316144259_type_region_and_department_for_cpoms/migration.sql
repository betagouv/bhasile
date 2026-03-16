/*
  Warnings:

  - You are about to drop the column `departements` on the `Cpom` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `Cpom` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cpom" DROP COLUMN "departements",
DROP COLUMN "region",
ADD COLUMN     "regionId" INTEGER;

-- CreateTable
CREATE TABLE "CpomDepartement" (
    "cpomId" INTEGER NOT NULL,
    "departementId" INTEGER NOT NULL,

    CONSTRAINT "CpomDepartement_pkey" PRIMARY KEY ("cpomId","departementId")
);

-- AddForeignKey
ALTER TABLE "Cpom" ADD CONSTRAINT "Cpom_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CpomDepartement" ADD CONSTRAINT "CpomDepartement_cpomId_fkey" FOREIGN KEY ("cpomId") REFERENCES "Cpom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CpomDepartement" ADD CONSTRAINT "CpomDepartement_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "Departement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

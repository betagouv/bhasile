/*
  Warnings:

  - Made the column `departementAdministratif` on table `Structure` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Structure" DROP CONSTRAINT "Structure_departementAdministratif_fkey";

-- AlterTable
ALTER TABLE "Structure" ALTER COLUMN "departementAdministratif" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_departementAdministratif_fkey" FOREIGN KEY ("departementAdministratif") REFERENCES "Departement"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `belongs_to_idf` on the `taux_encadrement_cible` table. All the data in the column will be lost.
  - You are about to drop the column `comes_from_huda` on the `taux_encadrement_cible` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `taux_encadrement_cible` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[structure_type]` on the table `taux_encadrement_cible` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "reporting"."taux_encadrement_cible_key";

-- AlterTable
ALTER TABLE "reporting"."taux_encadrement_cible" DROP COLUMN "belongs_to_idf",
DROP COLUMN "comes_from_huda",
DROP COLUMN "year";

-- CreateIndex
CREATE UNIQUE INDEX "taux_encadrement_cible_structure_type_key" ON "reporting"."taux_encadrement_cible"("structure_type");

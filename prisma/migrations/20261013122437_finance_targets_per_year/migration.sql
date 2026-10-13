/*
  Warnings:

  - A unique constraint covering the columns `[structure_type,year,belongs_to_idf]` on the table `tarif_journalier_cible` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `year` to the `tarif_journalier_cible` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "reporting"."tarif_journalier_cible_structure_type_belongs_to_idf_key";

-- AlterTable
ALTER TABLE "reporting"."tarif_journalier_cible" ADD COLUMN     "year" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "reporting"."taux_encadrement_cible" (
    "id" SERIAL NOT NULL,
    "structure_type" "StructureType" NOT NULL,
    "year" INTEGER NOT NULL,
    "belongs_to_idf" BOOLEAN NOT NULL,
    "comes_from_huda" BOOLEAN NOT NULL DEFAULT false,
    "taux_cible" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "taux_encadrement_cible_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "taux_encadrement_cible_key" ON "reporting"."taux_encadrement_cible"("structure_type", "year", "belongs_to_idf", "comes_from_huda");

-- CreateIndex
CREATE UNIQUE INDEX "tarif_journalier_cible_structure_type_year_belongs_to_idf_key" ON "reporting"."tarif_journalier_cible"("structure_type", "year", "belongs_to_idf");
